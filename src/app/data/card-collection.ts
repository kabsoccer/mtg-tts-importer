import { Card } from './card';

export interface CardCollection {
    identifiers: CardCollectionParam[]
}

export interface CardCollectionParam {
    name: string,
    set: string
}

export interface CardCollectionReturn {
    not_found: CardCollectionParam[],
    data: Card[]
}