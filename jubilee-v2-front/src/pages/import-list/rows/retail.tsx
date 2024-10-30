import FlexContainer from "~/components/ui/FlexContainer";
import Input from "~/components/ui/Input";
import _debounce from "lodash/debounce";
import { useCallback, useState } from "react";
import handleErrors from "~/helpers/handleErrors";
import { updateRetailPrice } from "~/api/dropshipping/requests";
import { useQueryClient } from "@tanstack/react-query";
import { IMPORT_LIST } from "~/api/dropshipping/types";
import { useTranslation } from "react-i18next";

type Props = {
  variantId: string;
  retailPriceCents: number;
};

export const Retail = ({ retailPriceCents, variantId }: Props) => {
  const [retailPrice, setRetailPrice] = useState(
    (retailPriceCents / 100)?.toFixed(2)
  );
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const handleUpdatePrice = async (retailPrice: string) => {
    if (Number(retailPrice) <= 0) return;

    const priceInCents = Math.round(Number(retailPrice) * 100);

    const payload = {
      variant_id: Number(variantId),
      retail_price_cents: priceInCents,
    };

    const toastMessages = {
      loading: t("dropshipping.loading_update_retail_price"),
      success: t("dropshipping.success_update_retail_price"),
      error: t("dropshipping.error_update_retail_price"),
    };

    await handleErrors(() => updateRetailPrice(payload), toastMessages);
    queryClient.invalidateQueries(IMPORT_LIST);
  };

  const debouncedUpdate = useCallback(_debounce(handleUpdatePrice, 500), []);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRetailPrice(e.target.value);
    debouncedUpdate(e.target.value);
  };

  return (
    <FlexContainer width="108px">
      <Input
        type="number"
        value={retailPrice}
        onChange={handleOnChange}
        placeholder="0.00"
        prefix="$"
      />
    </FlexContainer>
  );
};
