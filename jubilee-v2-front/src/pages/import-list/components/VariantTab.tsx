import FlexContainer from "~/components/ui/FlexContainer";
import { IProduct } from "~/types/dropshipping";
import Table from "./Table";
import _debounce from "lodash/debounce";
import { columns } from "../table";
import { IProductVariantsPayload } from "~/api/dropshipping/types";

type Props = {
  product: IProduct;
  handleBulkUpdateVariants: (payload: IProductVariantsPayload) => Promise<void>;
};

export const VariantTab = ({ product, handleBulkUpdateVariants }: Props) => {
  const shipping =
    product.shipping_options.find(({ country }) => country === product.country)
      ?.shipping ?? product.shipping_fallback;
  const dataTable = product?.variants.map((variant) => ({
    ...variant,
    shipping_domestic: shipping?.base_price_cents,
  }));

  return (
    <FlexContainer width="100%" justifyContent="space-between">
      <Table
        product_id={product.id}
        handleBulkUpdateVariants={handleBulkUpdateVariants}
        columns={columns}
        data={dataTable}
        padding="0"
      />
    </FlexContainer>
  );
};
