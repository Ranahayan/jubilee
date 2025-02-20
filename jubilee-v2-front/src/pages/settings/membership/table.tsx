import { Invoice, InvoiceStatus } from "~/types/billing";
import { createColumnHelper } from "@tanstack/react-table";
import { DownloadInvoice } from "./rows/DownloadInvoice";
import { BillingPeriod } from "./rows/BillingPeriod";
import { formatPrice } from "~/helpers/formatPrice";
import { CenteredText, TransactionId } from "./styles";
import { TFunction } from "i18next";
import { Status } from "./rows/Status";

const columnHelper = createColumnHelper<Invoice>();

export const columns = (t: TFunction) => [
  columnHelper.accessor("payment_external_id", {
    header: t("settings.transaction_id") ?? "",
    cell: (info) => (
      <TransactionId title={info.getValue()}>{info.getValue()}</TransactionId>
    ),
    enableResizing: true,
  }),
  columnHelper.accessor("entity_type", {
    header: t("settings.description") ?? "",
    cell: (info) =>
      info.getValue() === "subscription"
        ? t("settings.subscription_charge")
        : t("settings.order_charge"),
    enableResizing: true,
  }),
  columnHelper.accessor("amount", {
    header: () => <CenteredText>{t("settings.amount")}</CenteredText>,
    cell: (info) => (
      <CenteredText>{formatPrice("USD", info.getValue())}</CenteredText>
    ),
    enableResizing: true,
  }),
  columnHelper.accessor("status", {
    header: () => <CenteredText>{t("settings.status")}</CenteredText>,
    cell: (info) => <Status status={info.getValue() as InvoiceStatus} />,
    enableResizing: true,
  }),
  columnHelper.accessor("created_at", {
    header: () => <CenteredText>{t("settings.date")}</CenteredText>,
    cell: (info) => (
      <CenteredText>
        <BillingPeriod createdAt={info.getValue()} />
      </CenteredText>
    ),
    enableResizing: true,
  }),
  columnHelper.accessor("payment_method", {
    header: () => <CenteredText>{t("settings.payment_method")}</CenteredText>,
    cell: (info) =>
      info.getValue() ? <CenteredText>**{info.getValue()}</CenteredText> : null,
    enableResizing: true,
  }),
  columnHelper.accessor("invoice_pdf", {
    header: () => <CenteredText>{t("settings.action")}</CenteredText>,
    cell: (info) => {
      const pdfLink = info.getValue();
      if (!pdfLink) return null;

      return <DownloadInvoice invoice_pdf={pdfLink} />;
    },
    enableResizing: true,
  }),
];
