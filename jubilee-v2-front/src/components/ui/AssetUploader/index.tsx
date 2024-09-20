import { IFile } from "~/types/upload";
import { IAssetOption } from "~/types/AssetUploader";
import { FileUploader } from "react-drag-drop-files";
import { useUpload } from "~/hooks/useUpload";

import * as S from "./styles";
import { GridBox } from "../Radio/styles";
import Text from "../Text";
import Container from "../Container";
import { useTranslation } from "react-i18next";
import React from "react";

type Props = {
  files?: IFile[];
  fileOptions: IAssetOption[];
  disabled?: boolean;
  onChange?: (files: IFile[]) => void;
  children?: React.ReactNode;
};

const AssetUploader = ({
  files = [],
  onChange,
  fileOptions,
  disabled,
  children,
}: Props) => {
  const upload = useUpload();
  const { t } = useTranslation();

  const handleChange = (index: number) => async (file: File) => {
    const uplodedFile = await upload?.upload(file);
    let filesCopy: IFile[] = [...files];
    filesCopy[index] = uplodedFile as IFile;
    onChange && onChange(filesCopy);
  };

  return (
    <GridBox columnCount={fileOptions.length}>
      {fileOptions?.map((option, i) => (
        <S.AddFileContainer key={`${option.label}-${i}`}>
          <FileUploader
            classes="file-uploader"
            disabled={disabled}
            multiple={false}
            handleChange={handleChange(i)}
            types={option.fileTypes}>
            {files[i] ? (
              <S.Image src={files[i].url || files[i].file} />
            ) : children ? (
              children
            ) : (
              <Container flexDirection="column" padding="29px 12px">
                <S.AddFileText>{t("common.add_file")}</S.AddFileText>
                <Text>{option.label}</Text>
                <S.SmallText secondary>{option.info}</S.SmallText>
              </Container>
            )}
          </FileUploader>
        </S.AddFileContainer>
      ))}
    </GridBox>
  );
};

export default AssetUploader;
