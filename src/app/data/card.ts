export interface Card {
    name: string,
    id: string,
    image_uris: {
        normal: string,
        png: string,
        small: string,
        border_crop: string,
        art_crop: string
    };
    type_line: string,
    oracle_text: string,
    oracle_id: string,
    isCommander: boolean,
    quantity: number,
    set: string,
    set_name: string,
    prints_search_uri: string,
    card_faces: {}
    back_image_uris: {
        normal: string,
        png: string,
        small: string,
        border_crop: string,
        art_crop: string
    },
    all_parts: Token[]
};

export interface Token {
    object: string,
    id: string,
    component: string,
    name: string,
    type_line: string,
    uri: string
}