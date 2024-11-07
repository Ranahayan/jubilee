import { createColumnHelper } from "@tanstack/react-table";
import { ProductTitle } from "./components/columns/productTitle";
import { formatPrice } from "~/helpers/formatPrice";
import { Quantity } from "./components/columns/quantity";
import { ProductImage } from "./components/columns/productImage";
import * as S from "./styles";

const columnHelper = createColumnHelper<any>();

export const columns = [
  columnHelper.accessor("image", {
    header: "orders.table.image",
    cell: (info) => <ProductImage {...info.row.original}  />,
  }),
  columnHelper.accessor("title", {
    header: "orders.table.title",
    cell: (info) => <ProductTitle {...info.row.original}  />,
  }),
  columnHelper.accessor("available_quantity", {
    header: "orders.table.quantity",
    cell: (info) => (
      <Quantity
        maxQuantity={info.getValue()}
        isSampleOrder={info.row.original.isSampleOrder}
        status={info.row.original.status}
        realQuantity={info.row.original.quantity}
        variant={info.row.original.variant}
      />
    ),
  }),
  columnHelper.accessor("cost_cents", {
    header: "orders.table.cost",
    cell: (info) => <S.CenterText>{formatPrice("USD", info.getValue())}</S.CenterText>,
  }),
  columnHelper.accessor("total_shipping_cost_cents", {
    header: "orders.table.shipping",
    cell: (info) => <S.CenterText>{formatPrice("USD", info.getValue())}</S.CenterText>,
  }),
  columnHelper.accessor("total_cost_cents", {
    header: "orders.table.total",
    cell: (info) => <S.CenterText>{formatPrice("USD", info.getValue())}</S.CenterText>,
  })
];
