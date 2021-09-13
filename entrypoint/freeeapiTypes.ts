import { ParametersAndResponse as PR} from './__generated__/apiClient';

type Methods = PR[keyof PR]['method'];
type Uris = PR[keyof PR]['requestUri'];

type FilterByMethodAndUri<M extends Methods, U extends Uris> = {
  [K in keyof PR]: 
    PR[K]['method'] extends M 
    ? PR[K]['requestUri'] extends U 
      ? PR[K]
      : never
    : never;  
}

type MethodUris<M extends Methods> = 
  FilterByMethodAndUri<M, Uris>[keyof PR]['requestUri'];

type Params<M extends Methods, U extends Uris> = 
  FilterByMethodAndUri<M, U>[keyof PR]['parameters'];

type Response<M extends Methods, U extends Uris> =
  FilterByMethodAndUri<M, U>[keyof PR]['response'];

type ResponseContentType<M extends Methods, U extends Uris> =
  FilterByMethodAndUri<M, U>[keyof PR]['responseContentTypes'];

const freeeApi = () => ({
  /**
   *
   *
   * @template M extends Methods
   * @param {M} method
   */
  method: <M extends Methods>(method: M) => ({
    /**
     *
     *
     * @template U extends Uris<M>
     * @param {U} uri
     */
    requestUri: <U extends MethodUris<M>>(uri: U) => ({
      //できれば、contentTypeを飛ばしたいが、型情報だけだと無理か。
      responseContentTypes: <C extends ResponseContentType<M, U>>(contentType: C) => ({
  
        parameters: <P extends Params<M, U>>(params: P) => ({
          fetch: <R extends Response<M, U>>(): R => ({}) as any
        })
      })
    })
  })
});

const res = 
  freeeApi().
  method('get').
  requestUri('/api/1/account_items').
  responseContentTypes('application/json').
  parameters({
    company_id: 1,
  });


const res2 = 
  freeeApi().
  method('get').
  requestUri('/api/1/companies/{id}').
  responseContentTypes('application/json').
  parameters({
    id: 123,
    account_items: true,
  });

const res3 = 
  freeeApi().
  method('get').
  requestUri('/api/1/receipts/{id}/download').
  responseContentTypes('application/pdf').
  parameters({
    company_id: 1,
    id: 1,
  });

