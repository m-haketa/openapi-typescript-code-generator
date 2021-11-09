import { ParametersAndResponse } from './__generated__/apiClient';

type ApiType = {
  [key: string]: {
    parameters: Record<string, any> | void;
    response: Record<string, any> | string | void;
    method: 'get' | 'put' | 'post' | 'delete';
    requestUri: string;
    responseContentTypes: string | void;
  }
}

type Methods<T extends ApiType> = T[keyof T]['method'];
type Uris<T extends ApiType> = T[keyof T]['requestUri'];

type FilterByMethodAndUri<T extends ApiType, M extends Methods<T>, U extends Uris<T>> = {
  [K in keyof T]: 
    T[K]['method'] extends M 
    ? T[K]['requestUri'] extends U 
      ? T[K]
      : never
    : never;  
}

type MethodUris<T extends ApiType, M extends Methods<T>> = 
  FilterByMethodAndUri<T, M, Uris<T>>[keyof T]['requestUri'];

type Parameters<T extends ApiType, M extends Methods<T>, U extends Uris<T>> = 
  FilterByMethodAndUri<T, M, U>[keyof T]['parameters'];

type Response<T extends ApiType, M extends Methods<T>, U extends Uris<T>> =
  FilterByMethodAndUri<T, M, U>[keyof T]['response'];

type ResponseContentType<T extends ApiType, M extends Methods<T>, U extends Uris<T>> =
  FilterByMethodAndUri<T, M, U>[keyof T]['responseContentTypes'];

const api = <T extends ApiType>() => ({
  /**
   *
   *
   * @template M extends Methods
   * @param {M} method
   */
  method: <M extends Methods<T>>(method: M) => ({
    /**
     *
     *
     * @template U extends Uris<M>
     * @param {U} uri
     */
    requestUri: <U extends MethodUris<T, M>>(uri: U) => ({
      //できれば、contentTypeを飛ばしたいが、型情報だけだと無理か。
      responseContentTypes: <C extends ResponseContentType<T, M, U>>(contentType: C) => ({
  
        parameters: <P extends Parameters<T, M, U>>(parameters: P) => ({
          fetch: <R extends Response<T, M, U>>(): R => ({}) as any
        })
      })
    })
  })
});

const freeeApi = api<ParametersAndResponse>();

const res = 
  freeeApi.
  method('get').
  requestUri('/api/1/account_items').
  responseContentTypes('application/json').
  parameters({
    company_id: 1,
  }).
  fetch();


const res2 = 
  freeeApi.
  method('get').
  requestUri('/api/1/companies/{id}').
  responseContentTypes('application/json').
  parameters({
    id: 123,
    account_items: true,
  }).
  fetch();

const res3 = 
  freeeApi.
  method('get').
  requestUri('/api/1/receipts/{id}/download').
  responseContentTypes('application/pdf').
  parameters({
    company_id: 1,
    id: 1,
  }).
  fetch();

