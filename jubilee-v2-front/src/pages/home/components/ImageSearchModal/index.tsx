import Modal from "~/components/ui/Modal";
import * as S from "./styles";
import AssetUploader from "~/components/ui/AssetUploader";
import { useState } from "react";
import { IFile } from "~/types/upload";
import { SVG } from "~/components/ui/SVG";
import { faImage } from "@fortawesome/pro-regular-svg-icons";
import { Trans, useTranslation } from "react-i18next";

interface Props {
  isShowing: boolean;
  hide: () => void;
  onSubmit: (file: IFile) => void;
}

export const ImageSearchModal = ({ isShowing, hide, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<IFile | null>(null);

  return (
    <Modal id="image-search" isShowing={isShowing} padding="0" minWidth="min(622px, 90%)">
      <S.Container>
        <S.Title>{t("dropshipping.image_search_title")}</S.Title>

        <S.Description>
          {t("dropshipping.image_search_description")}
        </S.Description>

        <S.UploaderContainer>
          <AssetUploader
            fileOptions={[{ fileTypes: ["png", "jpg", "jpeg"], label: "" }]}
            files={uploadedImage ? [uploadedImage] : []}
            onChange={(files) => {
              setUploadedImage(files[0]);
            }}>
            <S.InnerContainer>
              <S.IconContainer>
                <SVG icon={faImage} color="textSecondary" />
              </S.IconContainer>

              <S.UploadText>
                <Trans
                  i18nKey="dropshipping.image_search_upload_title"
                  components={{
                    1: <S.HighlightedText />,
                  }}
                />
              </S.UploadText>

              <S.FileTypeText>
                {t("dropshipping.image_search_upload_format")}
              </S.FileTypeText>
            </S.InnerContainer>
          </AssetUploader>
        </S.UploaderContainer>

        <S.Footer>
          <S.CancelButton
            onClick={() => {
              hide();
              setUploadedImage(null);
            }}>
            {t("dropshipping.image_search_cancel")}
          </S.CancelButton>
          <S.SubmitButton
            isDisabled={uploadedImage === null}
            onClick={() => {
              if (uploadedImage) {
                onSubmit(uploadedImage);
                setUploadedImage(null);
              }
            }}>
            {t("dropshipping.image_search_submit")}
          </S.SubmitButton>
        </S.Footer>
      </S.Container>
    </Modal>
  );
};
