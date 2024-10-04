import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
	IDropshippingSettings,
	IMPORT_LIST,
	IOrdersList,
	IOrdersParams,
	ImportListParams,
	ORDERS,
	PRODUCTS,
	DROPSHIPPING_SETTINGS,
	BULK_CHECKOUT_SUMMARY
} from "./types";
import {
	createSampleOrder,
	getCategories,
	getImportList,
	getOrders,
	getProducts,
	getDropshippingSettings,
	updateDropshippingSettings,
	cancelSubOrder,
	getBulkCheckoutSummary,
	updateImportListBulk,
  updateBackgroundColor
} from "./requests";
import {
  ICategories,
  IProductList,
  IProductParams,
} from "~/types/dropshipping";

export const useGetProducts = (params?: IProductParams) =>
  useInfiniteQuery<IProductList>(
    [...PRODUCTS, params],
    ({ pageParam = 1 }) => {
      // Remove empty params
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([key, value]) => !!value)
      );

      return getProducts({ ...cleanParams, page: pageParam });
    },
    {
      getNextPageParam: (lastPage) => {
        const nextPage = lastPage.page + 1;
        if (nextPage <= lastPage.total_pages) return nextPage;
      },
    }
  );

export const useGetCategories = () =>
  useQuery<Array<ICategories>>([], () => getCategories());

export const useGetOrders = (params?: IOrdersParams) =>
  useQuery<IOrdersList>([...ORDERS, params], () => getOrders(params));

export const useGetImportList = (params?: ImportListParams) =>
  useQuery<IProductList>([...IMPORT_LIST, params], () => getImportList(params));

export const useCreateSampleOrder = () => useMutation(createSampleOrder);

export const useDropshippingSettings = () =>
  useQuery<IDropshippingSettings>(DROPSHIPPING_SETTINGS, () =>
    getDropshippingSettings()
  );

export const useUpdateDropshippingSettings = () => useMutation(updateDropshippingSettings);

export const useCancelSubOrder = () => useMutation(cancelSubOrder);

export const useGetBulkCheckoutSummary = (subOrderIds: number[] = [], orderType: string) =>
	useQuery([...BULK_CHECKOUT_SUMMARY, orderType, ...subOrderIds], () => getBulkCheckoutSummary(subOrderIds, orderType));

export const useUpdateImportListBulk = () => useMutation(updateImportListBulk);

export const useUpdateBackgroundColor = () =>
  useMutation(updateBackgroundColor);