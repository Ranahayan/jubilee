import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowSelectionState,
  Updater,
} from "@tanstack/react-table";
import * as S from "./styles";
import { useEffect, useState } from "react";
import { IProductVariantsPayload } from "~/api/dropshipping/types";

type Props = {
  product_id: string;
  columns: any[];
  data: unknown[];
  fontSizeRow?: string;
  padding?: string;
  handleBulkUpdateVariants: (payload: IProductVariantsPayload) => Promise<void>;
};

const VariantsTable = ({ columns, handleBulkUpdateVariants, product_id, data = [], fontSizeRow, padding }: Props) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    const initialSelectedRows: RowSelectionState = (data as any[]).reduce((acc, row, index) => {
      if (row.is_active) {
        acc[index] = true;
      }
      return acc;
    }, {});
    setRowSelection(initialSelectedRows);
  }, [data]);

  const handleRowSelectionChange = (stateUpdater: Updater<RowSelectionState>) => {
    if (typeof stateUpdater !== "function") return;

    const oldState = rowSelection;
    const newState = stateUpdater(oldState);

    const selectedData = data.filter((_, index) => newState[index]);
    const unselectedData = data.filter((_, index) => !newState[index]);

    const payload = [
      ...selectedData.map((row: any) => ({ id: row.id, is_active: true, imported_variant_id: row.imported_variant_id })),
      ...unselectedData.map((row: any) => ({ id: row.id, is_active: false, imported_variant_id: row.imported_variant_id })),
    ];

    setRowSelection(newState);

    handleBulkUpdateVariants({ product_id, variants: payload });
  }

  const table = useReactTable({
    columns,
    data,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: handleRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <S.Container padding={padding || "8px 48px"}>
      <S.StyledTable fontSize={fontSizeRow || "16px"}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} style={header.column.columnDef.meta}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={cell.column.columnDef.meta}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </S.StyledTable>
    </S.Container>
  );
};

export default VariantsTable;
