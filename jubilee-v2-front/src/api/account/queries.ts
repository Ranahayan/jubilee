import { useMutation, useQuery } from "@tanstack/react-query";
import { customization, getUser } from "./requests";

export const useUpdateCustomization = () => useMutation(customization);
