import { createColumnHelper } from "@tanstack/react-table";
import { formatPrice } from "~/helpers/formatPrice";
import { Retail } from "./rows/retail";
import { Profit } from "./rows/profit";
import * as S from "./ImportList.styles";
import Checkbox from "~/components/ui/Checkbox";
import { t } from "i18next";

export const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor("is_active", {
    header: ({ table }) => (
      <S.CellContainer>
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      </S.CellContainer>
    ),
    cell: ({ row }) => (
      <S.CellContainer>
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      </S.CellContainer>
    ),
  }),
  columnHelper.accessor("image", {
    header: t("dropshipping.image") as string,
    cell: (info) => (
      <S.ImageContainer>
        {info.getValue() ? <img src={info.getValue()} /> : null}
      </S.ImageContainer>
    ),
  }),
  columnHelper.accessor("sku", {
    header: "SKU",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("inventory_quantity", {
    header: t("dropshipping.inventory") as string,
    cell: (info) => info.getValue() || "0",
  }),
  columnHelper.accessor("price_cents", {
    header: t("dropshipping.cost") as string,
    cell: (info) => formatPrice("USD", info.getValue()),
  }),
  columnHelper.accessor("shipping_domestic", {
    header: t("dropshipping.shipping") as string,
    cell: (info) => formatPrice("USD", info.row.original?.shipping_domestic),
  }),
  columnHelper.accessor("retail_price_cents", {
    header: t("dropshipping.sales_price") as string,
    cell: (info) => (
      <Retail
        retailPriceCents={info.getValue()}
        variantId={info.row.original?.id}
      />
    ),
  }),
  columnHelper.accessor("profit", {
    header: t("dropshipping.profit") as string,
    cell: (info) => (
      <Profit
        retailPriceCents={info.row.original?.retail_price_cents}
        priceCents={info.row.original?.price_cents}
      />
    ),
  }),
];
