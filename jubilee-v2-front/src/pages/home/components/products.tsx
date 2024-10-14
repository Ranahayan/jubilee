import { InfiniteData } from "@tanstack/react-query";
import { Fragment } from "react";
import ProductCard from "~/pages/home/components/ProductCard";
import { IProduct, IProductList } from "~/types/dropshipping";

type Props = {
	lastElementRef: (node: HTMLDivElement) => void;
	handleAddToImportList: (product: IProduct) => void;
	products: InfiniteData<IProductList>;
	loading?: boolean;
	handleSampleOrder?: (id: number, isPremium?: boolean) => void;
	backgroundColor: string;
}

const colors = ["#FFDBD4", "#FFC7CE", "#FFE7E2"];
const getColorByIndex = (index: number) => colors[index % colors.length];

export const Products = ({
	lastElementRef,
	handleAddToImportList,
	products,
	loading,
	handleSampleOrder,
	backgroundColor
}: Props) => {
	return (
		<Fragment>
			{products?.pages.flatMap((group, i) => (
				group.data.map((product, index) => {
					const isTheLastOne = products.pages.length === i + 1 && group.data.length === index + 1; // This now has a meaning

					return (
						<ProductCard
							backgroundColor={backgroundColor || getColorByIndex(index)}
							ref={isTheLastOne ? lastElementRef : null}
							key={product.id}
							product={product}
							addToImportList={handleAddToImportList}
							loading={loading}
							handleSampleOrder={() => handleSampleOrder?.(product.variants[0].id)}
						/>
					)
				})
			))}
		</Fragment>
	)
};
