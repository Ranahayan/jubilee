import * as S from "./styles";
import Modal from "~/components/ui/Modal";
import { SVG } from "~/components/ui/SVG";
import Button from "~/components/ui/Button";
import { SVGIcon } from "~/components/ui/SVG/types";
import FlexContainer from "~/components/ui/FlexContainer";
import { useTranslation } from "react-i18next";
import { faImage } from "@fortawesome/pro-regular-svg-icons";
import { FileUploader } from "react-drag-drop-files";
import { useUpload } from "~/hooks/useUpload";
import { IFile } from "~/types/upload";
import { useState } from "react";

type Props = {
  isShowing: boolean;
  hide: () => void;
  handleAction: (file: IFile) => Promise<void>;
};

export const UploadImageModal = ({ isShowing, hide, handleAction }: Props) => {
  const { t } = useTranslation();
  const { upload } = useUpload();
  const [file, setFile] = useState<File | null>(null);

  const close = () => {
    hide();
    setFile(null);
  };

  const handleActionAndClose = async () => {
    if (!file) return;

    const uplodedFile = await upload(file);
    if (!uplodedFile) return;

    await handleAction(uplodedFile);
    close();
  };

  const handleChange = async (file: File) => {
    setFile(file);
  };

  return (
    <Modal id="upload-asset" isShowing={isShowing} padding="0px" minWidth="20%">
      <S.Container>
        <FlexContainer
          flexDirection="column"
          padding={0}
          alignItems="flex-start"
          justifyContent="flex-start">
          <S.ModalTitle>{t("upload.upload_file")}</S.ModalTitle>
          <S.ModalDescription>
            {t("upload.upload_file_desc")}
          </S.ModalDescription>
        </FlexContainer>
        <FileUploader
          classes="file-uploader"
          multiple={false}
          handleChange={handleChange}
          types={["png", "jpg", "jpeg"]}>
          <S.DragAndDropContainer>
            {file ? (
              <img height={150} width={150} style={{objectFit: 'contain'}} src={URL.createObjectURL(file)} alt="Preview" />
            ) : (
              <>
                <S.IconContainer>
                  <SVG icon={faImage as SVGIcon} size="xl" color="primary" />
                </S.IconContainer>
                <S.ModalDescription>
                  <S.ClickUploadText>
                    {t("upload.click_to_upload")}
                  </S.ClickUploadText>
                  {t("upload.drag_and_drop")}
                </S.ModalDescription>
                <S.ModalDescription>
                  {t("upload.types_and_size")}
                </S.ModalDescription>
              </>
            )}
          </S.DragAndDropContainer>
        </FileUploader>
        <FlexContainer width="100%">
          <Button
            color="black"
            bgColor="white"
            outline
            borderColor="disabled"
            children={t("upload.cancel")}
            onClick={close}
            width="25%"
            fontWeight={600}
            size="lg"
            alignSelf="center"
          />
          <Button
            color="white"
            bgColor="primary"
            children={t("upload.replace")}
            onClick={handleActionAndClose}
            size="lg"
            fontWeight={600}
            width="75%"
            alignSelf="center"
          />
        </FlexContainer>
      </S.Container>
    </Modal>
  );
};
