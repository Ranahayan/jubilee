import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Actions } from "../columns/actions";
import * as S from "./styles";
import { useTranslation } from "react-i18next";
import { StatusTag } from "../columns/status";
import { SubOrder, IShippingAddress, TrackingData } from "~/types/dropshipping";

type Props = {
  columns: any[];
  data: unknown[];
  orderId?: number;
  subOrderId?: number;
  subOrder?: SubOrder;
  isSampleOrder?: boolean;
  status?: string;
  tracking?: TrackingData;
  hideActions?: boolean;
  orderShippingAddress?: IShippingAddress | null;
};

const Table = ({
  columns,
  data = [],
  orderId,
  subOrderId,
  isSampleOrder = false,
  status,
  subOrder,
  tracking = {},
  hideActions = false,
  orderShippingAddress,
}: Props) => {
  const { t } = useTranslation();

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  const getInvalidItems = () => {
    return data
      .filter((item: any) => item.quantity < item.moq_quantity)
      .map((item: any) => ({
        title: item.title,
        moq_quantity: item.moq_quantity,
      }));
  };

  return (
    <S.Container padding={"0"}>
      <S.StyledTable fontSize={"16px"}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={header.column.columnDef.meta}>
                  {header.isPlaceholder
                    ? null
                    : t(
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        ) as string
                      )}
                </th>
              ))}
              {!hideActions && (
                <>
                  <th>{t("orders.table.status")}</th>
                  <th>{t("orders.table.action")}</th>
                </>
              )}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, i) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={cell.column.columnDef.meta}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}

              {i === 0 && !hideActions && (
                <>
                  <td
                    style={{ padding: "0px 8px" }}
                    rowSpan={table.getRowModel().rows.length}>
                    <StatusTag value={status as string} />
                  </td>
                  <td
                    style={{ padding: "0px 8px" }}
                    rowSpan={table.getRowModel().rows.length}>
                    <Actions
                      subOrder={subOrder as SubOrder}
                      orderId={orderId as number}
                      subOrderId={subOrderId as number}
                      isSampleOrder={isSampleOrder}
                      status={status as string}
                      tracking={tracking}
                      invalidItems={getInvalidItems()}
                    />
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </S.StyledTable>
    </S.Container>
  );
};

export default Table;
