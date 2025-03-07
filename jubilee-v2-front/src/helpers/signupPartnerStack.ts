export const signupPartnerStack = (email: string, id: number) => {
  try {
    const growsumo = (window as any).growsumo;
    if (!growsumo) return;

    growsumo.data.email = email;
    growsumo.data.customer_key = id;
    growsumo.createSignup();
  } catch (error) {
    console.error(error);
  }
}