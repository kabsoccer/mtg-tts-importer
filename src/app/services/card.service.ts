import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap, shareReplay  } from 'rxjs/operators'
import { Card, Token } from '../data/card';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CardCollection, CardCollectionParam, CardCollectionReturn } from '../data/card-collection';
import { DeckObject, TransformObject } from '../data/deck';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  private scryfallSingleUrl = "https://api.scryfall.com/cards/named?fuzzy=";
  private scryfallCollectionUrl = "https://api.scryfall.com/cards/collection";

  httpOptions = {
    headers: new HttpHeaders({'Content-Type': 'application/json'})
  };

  constructor(
    private http: HttpClient
  ) { }

  defaultTransform: TransformObject = {
    "posX": 0,
    "posY": 0,
    "posZ": 0,
    "rotX": 0,
    "rotY": 0,
    "rotZ": 0,
    "scaleX": 1.0,
    "scaleY": 1.0,
    "scaleZ": 1.0
  }
  mainDeckTransform: TransformObject = {
    "posX": 0,
    "posY": 0,
    "posZ": 0,
    "rotX": 0,
    "rotY": 0,
    "rotZ": 180,
    "scaleX": 1.0,
    "scaleY": 1.0,
    "scaleZ": 1.0
  }
  commanderTransform: TransformObject = {
    "posX": -2.5,
    "posY": 0,
    "posZ": 0,
    "rotX": 0,
    "rotY": 0,
    "rotZ": 0,
    "scaleX": 1.0,
    "scaleY": 1.0,
    "scaleZ": 1.0
  }
  flipCardsTransform: TransformObject = {
    "posX": 2.5,
    "posY": 0,
    "posZ": 0,
    "rotX": 0,
    "rotY": 0,
    "rotZ": 0,
    "scaleX": 1.0,
    "scaleY": 1.0,
    "scaleZ": 1.0
  }
  tokensTransform: TransformObject = {
    "posX": 5,
    "posY": 0,
    "posZ": 0,
    "rotX": 0,
    "rotY": 0,
    "rotZ": 0,
    "scaleX": 1.0,
    "scaleY": 1.0,
    "scaleZ": 1.0
  }
  defaultCardBack = "https://gamepedia.cursecdn.com/mtgsalvation_gamepedia/f/f8/Magic_card_back.jpg?version=0ddc8d41c3b69c2c3c4bb5d72669ffd7";

  cache = {};

  /*getCard(name: string): Observable<Card> {
    if (this.cache[name.toLowerCase()]) {
      console.log(name + " found in cache!");
      return this.cache[name.toLowerCase()];
    }
    return this.cache[name.toLowerCase()] = this.http.get<Card>(this.scryfallSingleUrl + name).pipe(
      shareReplay(1),
      tap(_ => console.log('fetching card')),
      catchError(_ => {
        delete this.cache[name.toLowerCase()];
        return this.handleError<Card>('getCard', <Card>{});
      })
    );
  }*/

  getToken(token: Token): Observable<Card> {
    if (this.cache[token.id]) {
      console.log(token.name + " found in cache!");
      return this.cache[token.id];
    }
    return this.cache[token.id] = this.http.get<Card>(token.uri).pipe(
      shareReplay(1),
      tap(_ => console.log('fetching card')),
      catchError(_ => {
        delete this.cache[token.id];
        return this.handleError<Card>('getToken', <Card>{});
      })
    )
  }

  getCards(names: string[]): Observable<CardCollectionReturn> {
    var collection: CardCollection = {"identifiers": []};
    var cardCollectionReturn: CardCollectionReturn = {"not_found": [], "data": []};
    names.forEach(name => {
      if (this.cache[name.toLowerCase()]) {
        console.log(name + " found in cache!");
        cardCollectionReturn.data.push(this.cache[name.toLowerCase()]);
      } else {
        collection.identifiers.push({"name": name} as CardCollectionParam);
      }
    });
    //console.log(collection);
    if (!collection.identifiers || collection.identifiers.length == 0) {
      return of(cardCollectionReturn);
    }

    var ret: Observable<CardCollectionReturn> = this.http.post<CardCollectionReturn>(this.scryfallCollectionUrl, collection).pipe(
      shareReplay(1),
      tap(el => {
        console.log('fetching collection');
        el.data.forEach(card => {this.cache[card.name.toLowerCase()] = card});
        el.data = el.data.concat(cardCollectionReturn.data);
        if (el.not_found.length > 0) {
          el.not_found.forEach(card => console.log("Card not found: " + card.name));
        }
      }),
      catchError(_ => {
        return this.handleError<CardCollectionReturn>('getCollection', <CardCollectionReturn>{});
      })
    );

    //console.log(ret);
    return ret;
  }

  getSets(card: Card): Observable<CardCollectionReturn> {
    if (this.cache[card.oracle_id + "_sets"]) {
      console.log(card.name + " sets found in cache!");
      return this.cache[card.oracle_id + "_sets"];
    }

    return this.cache[card.oracle_id + "_sets"] = this.http.get<CardCollectionReturn>(card.prints_search_uri).pipe(
      shareReplay(1),
      tap(el => {
        console.log('fetching sets');
        console.log(el);
      }),
      catchError(_ => {
        return this.handleError<CardCollectionReturn>('getSets', <CardCollectionReturn>{});
      })
    )
  }

  exportDeck(cardList: Card[], commanderCards: Card[], tokenList: Card[], quality: string, deckName: string, cardBack: string): void {
    if (cardBack === "") {
      cardBack = this.defaultCardBack;
    }
    // Warning: prepare for JSON vomit
    var deckObject  = {
      ObjectStates: []
    }
    deckObject.ObjectStates.push({
      Name: "Deck",
      Transform: this.mainDeckTransform,
      Nickname: deckName,
      Description: "",
      DeckIDs: [],
      CustomDeck: {},
      ContainedObjects: [],
    });

    var cardId: number = 1;
    
    // Main Deck
    cardList.forEach(card => {
      for(var i = 0; i < card.quantity; i++) {
        deckObject.ObjectStates[0].ContainedObjects.push({
          Name: "Card",
          Transform: this.defaultTransform,
          CardID: cardId * 100,
          Nickname: card.name,
          Description: card.oracle_text
        });
        deckObject.ObjectStates[0].DeckIDs.push(cardId * 100);
      }
      deckObject.ObjectStates[0].CustomDeck[cardId] = {
        FaceURL: card.image_uris[quality],
        BackURL: cardBack,
        NumWidth: 1,
        NumHeight: 1,
        BackIsHidden: true,
        UniqueBack: false,
        Type: 0
      };
      cardId++;
    });

    // Commander card
    if (commanderCards.length > 1) {
      deckObject.ObjectStates.push({
        Name: "Deck",
        Transform: this.commanderTransform,
        Nickname: "Commander",
        Description: "",
        DeckIDs: [],
        CustomDeck: {},
        ContainedObjects: [],
      });
      commanderCards.forEach(card => {
        deckObject.ObjectStates[1].ContainedObjects.push({
          Name: "Card",
          Transform: this.defaultTransform,
          CardID: cardId * 100,
          Nickname: card.name,
          Description: card.oracle_text
        });
        deckObject.ObjectStates[1].DeckIDs.push(cardId * 100);
        deckObject.ObjectStates[1].CustomDeck[cardId] = {
          FaceURL: card.image_uris[quality],
          BackURL: card.back_image_uris ? card.back_image_uris[quality] : cardBack,
          NumWidth: 1,
          NumHeight: 1,
          BackIsHidden: true,
          UniqueBack: false,
          Type: 0
        };
        cardId++;
      });
    } else {
      deckObject.ObjectStates.push({
        Name: "Card",
        Transform: this.commanderTransform,
        CardID: cardId * 100,
        Nickname: commanderCards[0].name,
        Description: commanderCards[0].oracle_text,
        CustomDeck: {}
      });
      deckObject.ObjectStates[1].CustomDeck[cardId] = {
        FaceURL: commanderCards[0].image_uris[quality],
        BackURL: commanderCards[0].back_image_uris ? commanderCards[0].back_image_uris[quality] : cardBack,
        NumWidth: 1,
        NumHeight: 1,
        BackIsHidden: true,
        UniqueBack: false,
        Type: 0
      }
      cardId++;
    }
    
    // Flip cards
    deckObject.ObjectStates.push({
      Name: "Deck",
      Transform: this.flipCardsTransform,
      Nickname: "Flip Cards",
      Description: "",
      DeckIDs: [],
      CustomDeck: {},
      ContainedObjects: [],
    });
    cardList.forEach(card => {
      if (!card.back_image_uris) {
        return;
      }
      for(var i = 0; i < card.quantity; i++) {
        deckObject.ObjectStates[2].ContainedObjects.push({
          Name: "Card",
          Transform: this.defaultTransform,
          CardID: cardId * 100,
          Nickname: card.name,
          Description: card.oracle_text
        });
        deckObject.ObjectStates[2].DeckIDs.push(cardId * 100);
      }
      deckObject.ObjectStates[2].CustomDeck[cardId] = {
        FaceURL: card.image_uris[quality],
        BackURL: card.back_image_uris[quality],
        NumWidth: 1,
        NumHeight: 1,
        BackIsHidden: true,
        UniqueBack: true,
        Type: 0
      };
      cardId++;
    });
    
    // Tokens
    deckObject.ObjectStates.push({
      Name: "Deck",
      Transform: this.tokensTransform,
      Nickname: "Tokens",
      Description: "",
      DeckIDs: [],
      CustomDeck: {},
      ContainedObjects: [],
    });
    tokenList.forEach(card => {
      deckObject.ObjectStates[3].ContainedObjects.push({
        Name: "Card",
        Transform: this.defaultTransform,
        CardID: cardId * 100,
        Nickname: card.name,
        Description: card.oracle_text
      });
      deckObject.ObjectStates[3].DeckIDs.push(cardId * 100);
      deckObject.ObjectStates[3].CustomDeck[cardId] = {
        FaceURL: card.image_uris[quality],
        BackURL: card.back_image_uris ? card.back_image_uris[quality] : cardBack,
        NumWidth: 1,
        NumHeight: 1,
        BackIsHidden: true,
        UniqueBack: false,
        Type: 0
      };
      cardId++;
    });

    console.log(deckObject);

    var filename = deckName;
    var contentType = "application/json;charset=utf-8;";
    var a = document.createElement('a');
      a.download = filename;
      a.href = 'data:' + contentType + ',' + encodeURIComponent(JSON.stringify(deckObject));
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  private handleError<T>(operation: string, result?: T): Observable<T> {
    console.log("error during " + operation);
    return of(result as T);
  }
}