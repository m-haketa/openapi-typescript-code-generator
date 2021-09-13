import { ParametersAndResponse as PR} from './__generated__/apiClient';

type Methods = PR[keyof PR]['method'];

type Uris<M extends Methods> = {
  [K in keyof PR]: PR[K]['method'] extends M ? PR[K]['requestUri'] : never;
}[keyof PR]

type Params<M extends Methods, U extends Uris<M>> = {
  [K in keyof PR]: 
    PR[K]['requestUri'] extends U
    ? PR[K]['method'] extends M 
      ? PR[K]['parameters']   
      : never
    : never;
}[keyof PR]

type Response<M extends Methods, U extends Uris<M>> = {
  [K in keyof PR]: 
    PR[K]['requestUri'] extends U
    ? PR[K]['method'] extends M 
      ? PR[K]['response']   
      : never
    : never;
}[keyof PR]

type PS = Params<'get','/api/1/account_items'>;

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
  requestUri: <U extends Uris<M>>(uri: U) => ({
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
