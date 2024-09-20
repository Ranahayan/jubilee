import { Editor } from '@tinymce/tinymce-react';
import { useRef, useState } from 'react';

import * as S from "./styles";
import Button from '../Button';
import { useTranslation } from 'react-i18next';
interface TinyMCEProps {
  initialValue: string;
  openModal?: (show: boolean) => void;
  handleImage?: (img: string) => void;
  plugins: string | string[] | undefined;
  toolbar: string | boolean | string[];
  contentStyle: string | undefined;
  blogId?: string;
  handleChange?: (content: string, id: string) => void;
  onChange?: (content: string) => void;
  handlePublish?: () => void;
  id?: string;
}

const TinyMCE = ({
  initialValue,
  openModal,
  handleImage,
  plugins,
  toolbar,
  contentStyle,
  blogId,
  handleChange,
  handlePublish,
  onChange,
  id
}: TinyMCEProps) => {
  const { t } = useTranslation();
  const editorRef = useRef<any>();
  const [content, setContent] = useState(initialValue);

  const handleEditorChange = (newContent: string) => {
    if (content !== '' && blogId !== '') {
      if (handleChange) {
        handleChange(newContent, blogId || "");
      }
    }

    if (onChange) onChange(newContent);
  
    setContent(newContent);
  };

  return (
    <S.EditorContainer>
      <Editor
        id={id || "112"}
        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
        onInit={(evt, editor) => (editorRef.current = editor)}
        initialValue={initialValue}
        onEditorChange={handleEditorChange}
        init={{
          height: "100%",
          width: "100%",
          menubar: false,
          plugins: plugins,
          toolbar: toolbar,
          content_style: contentStyle,
          selector: "a" as any,
          init_instance_callback: function (editor) {
            editor.on("click", function (e) {
              if (e.target.className === "update-image") {
                const offsetParent = e.target.offsetParent;
                const firstElementChild = offsetParent.firstElementChild;
              
                const imgSrc = firstElementChild.id;

                openModal && openModal(true);

                handleImage && handleImage(imgSrc);
              }
            });
          },
        }}
      />
      {handlePublish ? <S.ButtonContainer onClick={handlePublish}>
        <Button bgColor="gradient" color="white">{t("blog.publish")}</Button>
      </S.ButtonContainer> : null}
    </S.EditorContainer>
  );
};

export default TinyMCE;