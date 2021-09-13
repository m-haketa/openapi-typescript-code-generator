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

/**
 *
 *
 * @template M extends Methods
 * @param {M} method
 */
const freeeApi = <M extends Methods>(method: M) => ({
/**
 *
 *
 * @template U extends Uris<M>
 * @param {U} uri
 */
  requestUri: <U extends MethodUris<M>>(uri: U) => ({
   /**
    *
    *
    * @template P extends Params<M, U>
    * @template R extends Response<M, U>
    * @param {P} params
    * @returns {R}
    */
    parameters: <P extends Params<M, U>, R extends Response<M, U>>(params: P): R => {
      return {} as any;
    }
  })
})

const res = 
  freeeApi('get').
  requestUri('/api/1/account_items').
  parameters({
    company_id: 1,
  });


const res2 = 
  freeeApi('get').
  requestUri('/api/1/companies/{id}').
  parameters({
    id: 123,
    account_items: true,
  });