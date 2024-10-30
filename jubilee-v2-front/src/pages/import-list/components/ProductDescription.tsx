import { IProduct } from "~/types/dropshipping";
import TinyMCE from "~/components/ui/TinyMCE";
import FlexContainer from "~/components/ui/FlexContainer";
import { contentStyle, plugins, toolbar } from "~/constants/tinyMCE";

type Props = {
  product: IProduct;
  onDescriptionChange: (description: string) => void;
};

export const ProductDescription = ({ product, onDescriptionChange }: Props) => {
  return (
    <FlexContainer width="100%" height="350px" gap={2.5} padding="0px 0px">
      <TinyMCE
        id={product.id}
        contentStyle={contentStyle}
        plugins={plugins}
        toolbar={toolbar}
        initialValue={product.description || ""}
        onChange={onDescriptionChange}
      />
    </FlexContainer>
  );
};
