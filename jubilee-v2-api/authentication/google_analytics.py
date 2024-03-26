import json
from django.conf import settings
from google.cloud import bigquery
from google.oauth2 import service_account


class GA4BigQueryClient:
    """
    Reads GA4 BigQuery export tables.

    Typical dataset: analytics_<GA4_PROPERTY_ID>
    Tables:
      - events_YYYYMMDD
      - events_intraday_YYYYMMDD (streaming)
    """

    def __init__(self):
        sa_json = settings.GCP_SERVICE_ACCOUNT_JSON
        if not sa_json:
            raise RuntimeError("Missing settings.GCP_SERVICE_ACCOUNT_JSON")

        info = json.loads(sa_json)
        creds = service_account.Credentials.from_service_account_info(info)

        self.project_id = settings.GA4_BQ_PROJECT_ID
        self.dataset_id = settings.GA4_BQ_DATASET_ID

        self.client = bigquery.Client(project=self.project_id, credentials=creds)

    def _tables_union(self, start_suffix, end_suffix, include_intraday=True):
        # Note: BigQuery doesn't allow table wildcard suffix ranges as parameters;
        # embed suffix values directly in the SQL string.
        events = f"""
            SELECT * FROM `{self.project_id}.{self.dataset_id}.events_*`
            WHERE _TABLE_SUFFIX BETWEEN '{start_suffix}' AND '{end_suffix}'
        """
        if not include_intraday:
            return events

        intraday = f"""
            SELECT * FROM `{self.project_id}.{self.dataset_id}.events_intraday_*`
            WHERE _TABLE_SUFFIX BETWEEN '{start_suffix}' AND '{end_suffix}'
        """
        return f"({events}) UNION ALL ({intraday})"

    def fetch_sessions_with_surface(
        self,
        start_suffix,
        end_suffix,
        event_names=("shopify_app_ad_click", "add_to_cart"),
        limit=50000,
        include_intraday=True,
    ):
        """
        Returns one row per ga_session_id with surface fields.
        Extract surface_type/detail from:
          - event_params['surface_type'/'surface_detail'] if present
          - else parse from event_params['page_location'] query string
        """
        event_names_sql = ", ".join([f"'{e}'" for e in event_names])
        src = self._tables_union(start_suffix, end_suffix, include_intraday=include_intraday)

        sql = f"""
        WITH base AS (
          SELECT
            event_timestamp,
            user_pseudo_id,
            event_name,
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'surface_type') AS surface_type_param,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'surface_detail') AS surface_detail_param,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location
          FROM ({src})
          WHERE event_name IN ({event_names_sql})
        ),
        enriched AS (
          SELECT
            event_timestamp,
            user_pseudo_id,
            ga_session_id,
            COALESCE(
              surface_type_param,
              REGEXP_EXTRACT(page_location, r'[?&]surface_type=([^&]+)')
            ) AS surface_type,
            COALESCE(
              surface_detail_param,
              REGEXP_EXTRACT(page_location, r'[?&]surface_detail=([^&]+)')
            ) AS surface_detail
          FROM base
          WHERE ga_session_id IS NOT NULL
        )
        SELECT
          ga_session_id,
          ANY_VALUE(user_pseudo_id) AS user_pseudo_id,
          ANY_VALUE(surface_type) AS surface_type,
          ANY_VALUE(surface_detail) AS surface_detail,
          MIN(event_timestamp) AS first_event_ts,
          MAX(event_timestamp) AS last_event_ts
        FROM enriched
        GROUP BY ga_session_id
        ORDER BY last_event_ts DESC
        LIMIT {int(limit)}
        """

        rows = self.client.query(sql).result()
        return [dict(r) for r in rows]

    def fetch_installs(self, start_suffix, end_suffix, limit=50000, include_intraday=True):
        """
        Fetches shopify_app_install rows and extracts shop_url (string param).
        """
        src = self._tables_union(start_suffix, end_suffix, include_intraday=include_intraday)

        sql = f"""
        SELECT
          event_timestamp,
          user_pseudo_id,
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'shop_url') AS shop_url,
          (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'shop_id') AS shop_id
        FROM ({src})
        WHERE event_name = 'shopify_app_install'
        ORDER BY event_timestamp DESC
        LIMIT {int(limit)}
        """

        rows = self.client.query(sql).result()
        # keep only ones with shop_url
        out = []
        for r in rows:
            d = dict(r)
            if d.get("shop_url"):
                out.append(d)
        return out

    def fetch_installs_with_surface_guess(
        self,
        start_suffix,
        end_suffix,
        lookback_minutes=180,
        limit=50000,
        include_intraday=True,
    ):
        """
        Since install may not include ga_session_id, associate surface by:
          - same user_pseudo_id
          - nearest previous touch event within lookback window
        Returns rows: shop_url + ga_session_id + surface_* + touch_page_location + touch_page_referrer
        """
        src = self._tables_union(start_suffix, end_suffix, include_intraday=include_intraday)

        sql = f"""
        WITH installs AS (
          SELECT
            TIMESTAMP_MICROS(event_timestamp) AS install_ts,
            user_pseudo_id,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'shop_url') AS shop_url
          FROM ({src})
          WHERE event_name = 'shopify_app_install'
            AND (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'shop_url') IS NOT NULL
        ),
        touches AS (
          SELECT
            TIMESTAMP_MICROS(event_timestamp) AS touch_ts,
            user_pseudo_id,
            event_name AS touch_event,
            (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS ga_session_id,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'surface_type') AS surface_type_param,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'surface_detail') AS surface_detail_param,
            (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
            -- Try both keys; different implementations sometimes use one or the other
            COALESCE(
              (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referrer'),
              (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_referer')
            ) AS page_referrer
          FROM ({src})
          WHERE event_name IN ('shopify_app_ad_click', 'add_to_cart', 'page_view', 'view_item')
        ),
        enriched_touches AS (
          SELECT
            touch_ts,
            user_pseudo_id,
            touch_event,
            ga_session_id,
            page_location,
            page_referrer,
            COALESCE(surface_type_param, REGEXP_EXTRACT(page_location, r'[?&]surface_type=([^&]+)')) AS surface_type,
            COALESCE(surface_detail_param, REGEXP_EXTRACT(page_location, r'[?&]surface_detail=([^&]+)')) AS surface_detail
          FROM touches
          WHERE
            ga_session_id IS NOT NULL
            OR page_location LIKE '%surface_type=%'
            OR page_location LIKE '%surface_detail=%'
            OR page_location LIKE '%utm_%'
            OR page_location LIKE '%st_%'
            OR page_referrer LIKE '%utm_%'
            OR page_referrer LIKE '%st_%'
        )
        SELECT
          i.shop_url,
          i.install_ts,
          t.ga_session_id,
          t.surface_type,
          t.surface_detail,
          t.touch_ts,
          t.touch_event,
          t.page_location AS touch_page_location,
          t.page_referrer AS touch_page_referrer
        FROM installs i
        JOIN enriched_touches t
          ON t.user_pseudo_id = i.user_pseudo_id
         AND t.touch_ts <= i.install_ts
         AND t.touch_ts >= TIMESTAMP_SUB(i.install_ts, INTERVAL {int(lookback_minutes)} MINUTE)
        QUALIFY ROW_NUMBER() OVER (
          PARTITION BY i.user_pseudo_id, i.install_ts
          ORDER BY t.touch_ts DESC
        ) = 1
        ORDER BY i.install_ts DESC
        LIMIT {int(limit)}
        """

        rows = self.client.query(sql).result()
        return [dict(r) for r in rows]
