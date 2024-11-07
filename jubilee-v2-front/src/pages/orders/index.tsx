import { Fragment, useEffect, useMemo, useState } from "react";
import Container from "~/components/ui/Container";
import PageTitle from "~/components/ui/PageTitle";
import Table from "./components/table";
import { columns } from "./table";
import { Header } from "./components/header";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGetOrders } from "~/api/dropshipping/queries";
import { Order, OrderType, Status } from "~/types/dropshipping";
import FlexContainer from "~/components/ui/FlexContainer";
import dayjs from "dayjs";
import { Pagination } from "~/components/ui/Pagination";
import * as S from "./styles";
import { EmptyState } from "~/components/ui/EmptyState";
import { faRoadBarrier } from "@fortawesome/pro-solid-svg-icons";
import { SVGIcon } from "~/components/ui/SVG/types";
import { PAGE_SIZE } from "~/constants/page";
import { Search } from "~/components/search";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { Filters } from "~/components/filters";
import OrderStatusSVG from "~/assets/svg/order-status.svg?react";
import { CheckboxWithButton } from "~/components/checkboxWithButton";
import { ShowBulkCheckoutSummary } from "~/components/show-bulk-checkout-summary/showBulkCheckoutSummary";
import Modal from "~/components/ui/Modal";
import LoaderSVG from "~/assets/svg/loader.svg?react";

const statusFilters = [
  { labelKey: "orders.unpaid", value: "unpaid" },
  { labelKey: "orders.processing", value: "processing" },
  { labelKey: "orders.shipped", value: "shipped" },
  { labelKey: "orders.cancelled", value: "cancelled" },
];

const OrdersPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const isSampleOrder = useLocation().pathname.includes("sample");
  const orderType = isSampleOrder ? OrderType.SAMPLE_ORDER : OrderType.SHOPIFY;
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const { data: orders, isLoading } = useGetOrders({
    order_type: orderType,
    page: page,
    ...(searchTerm ? { search_term: searchTerm } : {}),
    ...(filters.length > 0 ? { status: filters.join(",") } : {}),
  });
  const totalCount = (orders?.total_pages as number) * PAGE_SIZE - 1;
  const isAboveTablet = useMediaQuery("tablet");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectAllUnpaid, setSelectAllUnpaid] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

  useEffect(() => {
    setPage(1);
  }, [orderType]);

  const handleSelect = (orderId: number) => {
    setSelectedOrders((prev) => {
      if (prev.includes(orderId)) {
        return prev.filter((id) => id !== orderId);
      }
      return [...prev, orderId];
    });
  };

  const getOrderStatus = (order: Order): string => {
    for (const subOrder of order.sub_orders) {
      if (subOrder.status_display === "unpaid") {
        return Status.UNPAID;
      }
    }

    return order?.sub_orders?.[0]?.status_display;
  };

  const getShippingAddress = (order: Order) => {
    if (order && order.shipping_address) {
      const { line_1, line_2, city, state, country, zip } = order.shipping_address;
      let addressLines = [line_1, line_2, city, state, country, zip];
      addressLines = addressLines.filter((line) => line !== null && line !== undefined && line !== "");
      let address = addressLines.join(", ");

      if (address === "") {
        return "-";
      }

      return address
    }
    return "";
  };

  return (
    <Fragment>
      <PageTitle>
        {isSampleOrder ? t("orders.sample_orders") : t("orders.shopify_orders")}
      </PageTitle>

      <S.SearchWrapper>
        <Search
          placeholder={t("dropshipping.search_order") as string}
          onClick={(searchTerm) => setSearchTerm(searchTerm)}
          width={isAboveTablet ? "50%" : "100%"}
        />
      </S.SearchWrapper>

      <S.ActionsWrapper>
        <CheckboxWithButton
          label={t("orders.select_all_unpaid")}
          buttonLabel={t("orders.bulk_checkout")}
          onToggle={() => setSelectAllUnpaid(!selectAllUnpaid)}
          onClick={() => setShowBulkModal(true)}
          isDisabled={selectedOrders.length === 0 && !selectAllUnpaid}
        />
        <Filters
          label={t("orders.order_status")}
          icon={<OrderStatusSVG />}
          filters={statusFilters}
          value={filters}
          onChange={setFilters}
        />
      </S.ActionsWrapper>

      <FlexContainer flexDirection="column" gap={2.0} width="100%">
        {orders?.data?.map((order: Order) => (
          <Container
            data-testid="order-container"
            key={order?.id}
            padding="16px 16px"
            flexDirection="column"
            width="100%">
            <Header
              isSelected={
                selectedOrders.includes(order?.id) ||
                (selectAllUnpaid &&
                  getOrderStatus(order) === "unpaid" &&
                  !!order.customer)
              }
              onToggle={() => handleSelect(order?.id)}
              order_id={order?.id}
              order_date={dayjs(order?.created_at).format("MMM DD, YYYY")}
              order_number={order?.shopify_order_name as string}
              customer={
                order?.customer &&
                `${order?.customer?.first_name} ${order?.customer?.last_name}`
              }
              customer_phone={order?.shipping_address?.phone}
              status={getOrderStatus(order)}
              shipping_address={getShippingAddress(order)}
              //@ts-ignore
              supplier={order?.sub_orders[0]?.supplier?.name as string}
              isSampleOrder={isSampleOrder}
            />
            {order?.sub_orders?.map((subOrder) => {
              return (
                <Fragment key={subOrder?.id}>
                  <Table
                    tracking={{
                      trackingNumber: subOrder?.tracking_number as string,
                      trackingUrl: subOrder?.tracking_link as string,
                      carrier: subOrder?.tracking_carrier as string,
                    }}
                    subOrder={subOrder}
                    subOrderId={subOrder?.id}
                    orderId={order?.id}
                    isSampleOrder={isSampleOrder}
                    status={subOrder.status_display}
                    columns={columns}
                    orderShippingAddress={order.shipping_address}
                    data={subOrder?.line_items.map((item) => ({
                      ...item,
                      supplier: subOrder?.supplier,
                      isSampleOrder: isSampleOrder,
                      status: subOrder?.status,
                    }))}
                  />
                </Fragment>
              );
            })}
          </Container>
        ))}
      </FlexContainer>
      {orders?.data && orders?.data?.length > 0 && (
        <Pagination
          totalCount={totalCount}
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalPages={orders?.total_pages as number}
          onPageChange={(page) => setPage(page as number)}
        />
      )}

      {(orders?.data?.length === 0 || (!orders && !isLoading)) && (
        <EmptyState
          title={t("dropshipping.orders_empty_state_title")}
          description={t("dropshipping.orders_empty_state_desc")}
          icon={faRoadBarrier as SVGIcon}
        />
      )}
      {isLoading && (
        <S.Loader>
          <LoaderSVG />
        </S.Loader>
      )}

      <Modal
        id="bulk-checkout"
        hideCloseButton
        hide={() => setShowBulkModal(false)}
        isShowing={showBulkModal}
        padding="24px 28px">
        <ShowBulkCheckoutSummary
          selectAllUnpaid={selectAllUnpaid}
          ids={selectedOrders}
          hide={() => setShowBulkModal(false)}
          orderType={orderType}
        />
      </Modal>
    </Fragment>
  );
};

export default OrdersPage;
