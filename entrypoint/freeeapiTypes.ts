import { ParametersAndResponse as PR} from './__generated__/apiClient';

type Uris = PR[keyof PR]['requestUri'];

type Methods<U extends Uris> = {
  [K in keyof PR]: PR[K]['requestUri'] extends U ? PR[K]['method'] : never;
}[keyof PR]

type Params<U extends Uris, M extends Methods<U>> = {
  [K in keyof PR]: 
    PR[K]['requestUri'] extends U
    ? PR[K]['method'] extends M 
      ? PR[K]['parameters']   
      : never
    : never;
}[keyof PR]

type Response<U extends Uris, M extends Methods<U>> = {
  [K in keyof PR]: 
    PR[K]['requestUri'] extends U
    ? PR[K]['method'] extends M 
      ? PR[K]['response']   
      : never
    : never;
}[keyof PR]

type PS = Params<'/api/1/account_items','get'>;

const api = <U extends Uris>(uri: U) => ({
  method: <M extends Methods<U>>(method: M) => ({
    parameters: <P extends Params<U, M>, R extends Response<U, M>>(params: P): R => {
      return {} as any;
    }
  })
})

const r = api('/api/1/account_items').method('get').parameters({
  company_id: 1
});
