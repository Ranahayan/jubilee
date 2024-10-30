import { IProduct, IProductAssets } from "~/types/dropshipping";
import FlexContainer from "~/components/ui/FlexContainer";
import * as S from "./ProductCard.styles";
import { SVG } from "~/components/ui/SVG";
import { Icon } from "@fortawesome/fontawesome-svg-core";
import {
  faTrash,
  faImage,
  faRefresh,
  faCircleExclamation,
} from "@fortawesome/pro-regular-svg-icons";
import { DialogModal } from "~/components/dialogModal";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  deleteProductAsset,
  createProductAsset,
  updateProductAsset,
} from "~/api/dropshipping/requests";
import handleErrors from "~/helpers/handleErrors";
import { useQueryClient } from "@tanstack/react-query";
import { IMPORT_LIST } from "~/api/dropshipping/types";
import { UploadImageModal } from "~/components/updateImageModal";
import { IFile } from "~/types/upload";

type Props = { product: IProduct };

export const ProductImages = ({ product }: Props) => {
  const [assetToDelete, setAssetToDelete] = useState<number>();
  const [assetToUpdate, setAssetToUpdate] = useState<IProductAssets>();
  const [showImageModal, setShowImageModal] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;

    const toastMessages = {
      loading: t("dropshipping.deleting_image"),
      success: t("dropshipping.delete_image_success"),
      error: t("dropshipping.delete_image_error"),
    };

    await handleErrors(() => deleteProductAsset(assetToDelete), toastMessages);
    queryClient.refetchQueries(IMPORT_LIST);
    setAssetToDelete(undefined);
  };

  const handleUploadAsset = async (file: IFile) => {
    if (!file) return;

    const toastMessages = {
      loading: t("dropshipping.uploading_image"),
      success: t("dropshipping.upload_image_success"),
      error: t("dropshipping.upload_image_error"),
    };

    const requestMethod = assetToUpdate ? updateProductAsset : createProductAsset;

    const payload = {
      id: assetToUpdate?.id,
      image: file.id,
      order: assetToUpdate?.order || (product.assets?.length || 0),
      product: product.id,
    }

    await handleErrors(() => requestMethod(payload), toastMessages);
    queryClient.refetchQueries(IMPORT_LIST);
    setAssetToUpdate(undefined);
  };

  return (
    <FlexContainer
      flexWrap="wrap"
      width="100%"
      gap={2.5}
      padding="0px 0px"
      justifyContent="flex-start"
      alignItems="flex-start">
      {product?.assets?.length
        ? product.assets.map((asset) => (
            <S.ProductImage>
              <img
                key={asset.id}
                src={asset.image}
                alt={product.title}
                style={{ objectFit: "cover" }}
              />
              <S.DeleteButton onClick={() => setAssetToDelete(asset.id)}>
                <SVG color="primary" size="1x" icon={faTrash as Icon} />
              </S.DeleteButton>
              <S.ChangeButton
                onClick={() => {
                  setShowImageModal(true);
                  setAssetToUpdate(asset);
                }}>
                <SVG color="primary" size="1x" icon={faRefresh as Icon} />
              </S.ChangeButton>
            </S.ProductImage>
          ))
        : null}
      <S.ProductImage onClick={() => setShowImageModal(true)}>
        <SVG color="disabled" size="5x" icon={faImage as Icon} />
        <S.AddImage>{t("dropshipping.add_image")}</S.AddImage>
      </S.ProductImage>
      <DialogModal
        id="delete-asset"
        isShowing={!!assetToDelete}
        icon={faCircleExclamation}
        hide={() => setAssetToDelete(undefined)}
        title={t("dropshipping.delete_image")}
        description={t("dropshipping.delete_product_image_desc")}
        buttonText={t("dropshipping.delete")}
        buttonCancelText={t("dropshipping.cancel")}
        buttonColor="primary"
        handleAction={handleDeleteAsset}
      />
      <UploadImageModal
        isShowing={showImageModal}
        hide={() => setShowImageModal(false)}
        handleAction={handleUploadAsset}
      />
    </FlexContainer>
  );
};
