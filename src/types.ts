import type { QueryClient, QueryFilters, UndefinedInitialDataOptions, UseMutationOptions, UseMutationResult, UseQueryResult } from '@tanstack/react-query';


// react query type overrides
type QueryOptionsOmittedTypes = 'queryKey' | 'queryFn';

export type QueryOptions<T> = {
  onError?: (error: unknown) => void;
  onSuccess?: (data: T) => void;
  onSettled?: (data: T | undefined, error: unknown | null) => void;
} & Partial<Omit<UndefinedInitialDataOptions<T, unknown>, QueryOptionsOmittedTypes>>


type MutationOptionsOmittedTypes = 'mutationFn' | 'onMutate';

export type MutationOptions<TData, TVariables, TContext> = Omit<UseMutationOptions<TData, unknown, TVariables, TContext>, MutationOptionsOmittedTypes> & {
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
};


export type QueryReturnType<T, TArgs> = { useQuery: (args: TArgs, options?: QueryOptions<T>, _key?: string) => UseQueryResult<T, unknown> }
export type MutationReturnType<T, TArgs> = { useMutation: <TContext = unknown>(options?: MutationOptions<T, TArgs, TContext>) => UseMutationResult<T, unknown, TArgs, TContext> }


// Routing
export type RouteFunction<TArgs = any, TResult = any> = (args: TArgs) => TResult | Promise<TResult>;

export type InferArgs<T> = T extends RouteFunction<infer Args, any> ? Args : never;
export type InferResult<T> = T extends RouteFunction<any, infer Result> ? Result : never;
export type InferRoutes<T> = T extends { [key: string]: any } ? T : never;

export type Routes = {
  [key: string]:
  | QueryReturnType<InferResult<RouteFunction>, InferArgs<RouteFunction>>
  | MutationReturnType<InferResult<RouteFunction>, InferArgs<RouteFunction>>
  | RouterReturnType<InferRoutes<InferResult<RouteFunction>>>
};

export type RouterReturnType<T extends Routes> = {
  [K in keyof T]: T[K] extends Routes
  ? RouterReturnType<T[K]>
  : T[K];
} & { useContext: () => ContextValue<T> };
// context

export type ContextValue<T extends Routes> = {
  [K in keyof T]: T[K] extends RouterReturnType<infer U>
  ? ContextValue<U>
  : T[K] extends { useQuery: any }
  ? T[K] extends { useQuery: infer UseQuery }
  ? UseQuery extends (...args: any) => any
  ? {
    getData: (queryKey?: Parameters<UseQuery>[0]) => ReturnType<UseQuery>['data'] | undefined;
    setData: (queryKey: Parameters<UseQuery>[0], data: ReturnType<UseQuery>['data']) => void;
    cancel: (filters?: QueryFilters) => void;
    invalidate: (filters?: QueryFilters) => void;
  }
  : never
  : never
  : never
};


//context
export type ReactSafeQueryContextProps = {
  queryClient: QueryClient;
}
