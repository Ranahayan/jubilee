import { faTrash } from "@fortawesome/pro-solid-svg-icons";
import { useTranslation } from "react-i18next";
import FlexContainer from "~/components/ui/FlexContainer";
import { SVG } from "~/components/ui/SVG";
import { SVGIcon } from "~/components/ui/SVG/types";
import Text from "~/components/ui/Text";

import * as S from "../../styles";
import handleErrors from "~/helpers/handleErrors";
import { deleteSampleOrder } from "~/api/dropshipping/requests";
import { useQueryClient } from "@tanstack/react-query";
import { ORDERS } from "~/api/dropshipping/types";
import { Status } from "~/types/dropshipping";
import { SIDEBAR_COUNT_SAMPLE_ORDERS } from "~/api/sidebarCounts/types";

type Props = { 
	title: string;
	supplier: { name: string } | null;
	sku: string;
	isSampleOrder?: boolean;
	variant?: number;
	status?: string;
}

export const ProductTitle = ({ title, status, isSampleOrder = false, variant }: Props) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const isPaid = status !== Status.UNPAID;

	const handleDeleteSubOrder = async () => {
		const toastMessages = {
			loading: t("dropshipping.loading_remove"),
			success: t("dropshipping.success_remove"),
			error: t("dropshipping.error_remove")
		};

		await handleErrors(() => deleteSampleOrder({ variant_id: variant as number }), toastMessages);
		queryClient.refetchQueries(ORDERS);
		queryClient.refetchQueries(SIDEBAR_COUNT_SAMPLE_ORDERS);
	};

	return (
		<S.ProductTitle>
			<S.ProductTitleText>{title}</S.ProductTitleText>
			{(isSampleOrder && !isPaid) && (
				<FlexContainer gap={0}>
					<S.FlexContainerPointed
						gap={0.6}
						//@ts-ignore
						onClick={handleDeleteSubOrder}
					>
						<SVG icon={faTrash as SVGIcon} size="sm"/>
						<Text>{t("orders.remove")}</Text>
					</S.FlexContainerPointed>
				</FlexContainer>
			)}
		</S.ProductTitle>
	);
};
