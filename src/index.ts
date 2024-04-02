import {
  useQuery as useTanStackQuery,
  useMutation as useTanStackMutation,
  useQueryClient,
  type QueryFilters,
} from '@tanstack/react-query';
import type {
  QueryOptions,
  MutationOptions,
  RouteFunction,
  QueryReturnType,
  MutationReturnType,
  ContextValue,
  Routes,
} from './types';



export const query = <TArgs, TResult>(
  queryFn: RouteFunction<TArgs, TResult>
): QueryReturnType<TResult, TArgs> => {
  const useQuery = (
    args: TArgs,
    options?: QueryOptions<TResult>,
    _key?: string
  ) => useTanStackQuery<TResult, unknown>({
    ...(options || {}),
    queryKey: [_key, args],
    queryFn: async () => {
      try {
        const result = await queryFn(args);
        options?.onSuccess && options.onSuccess(result);
        options?.onSettled && options.onSettled(result, null);
        return result;
      } catch (error) {
        options?.onError && options.onError(error);
        options?.onSettled && options.onSettled(undefined, error);
        throw error;
      }
    },
  });
  return { useQuery };
};

export const mutation = <TArgs, TResult>(
  mutationFn: RouteFunction<TArgs, TResult | Promise<TResult>>
): MutationReturnType<TResult, TArgs> => {
  const useMutation = <TContext = unknown>(options?: MutationOptions<TResult, TArgs, TContext>) =>
    useTanStackMutation<TResult, unknown, TArgs, TContext>({
      ...options,
      mutationFn: async (args) => {
        const res = await mutationFn(args);
        return res;
      },
    });
  return { useMutation };
};


const createContext = <T extends Routes>(routes: T, routerId: string): () => ContextValue<T> => {
  return () => {
    const queryClient = useQueryClient();
    const context: ContextValue<T> = {} as ContextValue<T>;
    Object.entries(routes).forEach(([key, value]) => {
      const fullKey = routerId + '/' + key;
      if (typeof value === 'object' && 'useQuery' in value && typeof value.useQuery === 'function') {
        const baseKey = fullKey;
        const useQueryKey = key as keyof ContextValue<T>;
        context[useQueryKey] = {
          getData: (queryKey?: Parameters<typeof value.useQuery>[0]) => queryClient.getQueryData([baseKey, queryKey]),
          setData: (queryKey: Parameters<typeof value.useQuery>[0], data: ReturnType<typeof value.useQuery>) => queryClient.setQueryData([baseKey, queryKey], data),
          cancel: (filters?: QueryFilters) => queryClient.cancelQueries({ ...filters, queryKey: [baseKey, filters?.queryKey] }),
          invalidate: (filters?: QueryFilters) => queryClient.invalidateQueries({ ...filters, queryKey: [baseKey, filters?.queryKey] }),
        } as ContextValue<T>[keyof ContextValue<T>];
      } else if (typeof value === 'object' && 'useContext' in value) {
        context[key as keyof ContextValue<T>] = value.useContext() as ContextValue<T>[keyof ContextValue<T>]
      }
    });
    return context;
  };
};



const applyQueryKeyMiddleware = <T extends Routes>(routes: T, routerId: string) => {
  Object.entries(routes).forEach(([key, value]) => {
    if ('useQuery' in value && typeof value.useQuery === 'function') {
      const originalUseQuery = value.useQuery;
      value.useQuery = (args: Parameters<typeof value.useQuery>[0], options: Parameters<typeof value.useQuery>[1]) => originalUseQuery(args, options, routerId + '/' + key);
    }
  });
};

let routerCount = 0;
export const createRouter = <T extends Routes>(routes: T) => {
  const routerId = routerCount++ + '';
  applyQueryKeyMiddleware(routes, routerId);

  return {
    ...routes,
    useContext: createContext(routes, routerId),
  }
};
