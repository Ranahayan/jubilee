import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import * as S from "./styles";

type Props = {
  columns: any[];
  data: unknown[];
  fontSizeRow?: string;
  padding?: string;
  headerBg?: string;
};

const Table = ({
  columns,
  data = [],
  fontSizeRow,
  padding,
  headerBg,
}: Props) => {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <S.Container padding={padding || "8px 48px"}>
      <S.StyledTable fontSize={fontSizeRow || "16px"} headerBg={headerBg}>
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

export default Table;
