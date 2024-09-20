
import React from 'react';
import { InputProps } from 'react-tagsinput';
import * as S from './styles';

interface ITagInput extends Omit<InputProps, 'value' | 'onChange'> {
  value?: string[];
  onChange?: (newTags: string[]) => void;
  placeholder?: string;
}

export const MAX_TAG = 10;

const TagInput: React.FC<ITagInput> = ({ value = [], form, onChange, placeholder, ...restProps }) => {
  const hasMaxTag = value.length === 10;

  const handleTagsChanged = (newTags: string[]) => {
    onChange ? onChange(newTags) : null;
  };

  return (
    <S.TagsInputContainer>
      <S.TagsInputStyled
        value={value}
        //@ts-ignore
        onChange={handleTagsChanged}
        addKeys={[",", "Enter", "Tab"]}
        maxTags={MAX_TAG}
        inputProps={{ placeholder }}
        {...restProps}
      />

      <S.Count className={`${hasMaxTag ? "max" : ""}`}>{value.length}/10</S.Count>
    </S.TagsInputContainer>
  );
};

export default TagInput;
