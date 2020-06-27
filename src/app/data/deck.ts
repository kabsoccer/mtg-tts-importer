export interface DeckObject {
    Name: string,
    Transform: TransformObject,
    Nickname: string,
    Description: string,
    DeckIDs: number[],
    CustomDeck: {},
    ContainedObjects: ContainedObject[]
}

export interface CustomDeckObject {
    FaceURL: string,
    BackURL: string,
    NumWidth: number,
    NumHeight: number,
    BackIsHidden: boolean,
    UniqueBack: boolean,
    Type: number
}

export interface ContainedObject {
    Name: string,
    Transform: {
        posX: number,
        posY: number,
        posZ: number,
        rotX: number,
        rotY: number,
        rotZ: number,
        scaleX: number,
        scaleY: number,
        scaleZ: number
    },
    CardID: number,
    Nickname: string,
    Description: string
}

export interface TransformObject {
    posX: number,
    posY: number,
    posZ: number,
    rotX: number,
    rotY: number,
    rotZ: number,
    scaleX: number,
    scaleY: number,
    scaleZ: number
}