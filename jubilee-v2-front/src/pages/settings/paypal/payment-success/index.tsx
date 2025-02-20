import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { paypalConfirmSubscription } from "~/api/billing/requests";
import Loader from "~/components/ui/Loader";
import { paths } from "~/router/paths";

export default function PaymentSuccess() {
  const params = useParams();
  const { subscriptionId } = params;

  const [searchParams] = useSearchParams();
  const executeToken = searchParams.get("token");

  const navigate = useNavigate();

  useEffect(() => {
    const confirmSubscription = async () => {
      if (executeToken) {
        const { plan_id } = await paypalConfirmSubscription(
          Number(subscriptionId),
          executeToken
        );

        navigate({
          pathname: paths.app.home,
          search: `?plan_id=${plan_id}`,
        });
      }
    };

    confirmSubscription();
  }, [executeToken]);

  return <Loader fullWidth />;
}
