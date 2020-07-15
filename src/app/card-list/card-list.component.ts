import { Component, OnInit, Input, OnChanges, ViewChild } from '@angular/core';
import { CardService } from '../services/card.service';
import { Card, Token } from '../data/card';
import { FormControl, FormGroup } from '@angular/forms';
import { MatAccordion } from '@angular/material/expansion';

@Component({
  selector: 'app-card-list',
  templateUrl: './card-list.component.html',
  styleUrls: ['./card-list.component.css']
})
export class CardListComponent implements OnInit {

  constructor(private cardService: CardService) { }
  @Input() cardNames: string[];
  @ViewChild(MatAccordion) accordion: MatAccordion;

  defaultCardBack = "https://gamepedia.cursecdn.com/mtgsalvation_gamepedia/f/f8/Magic_card_back.jpg?version=0ddc8d41c3b69c2c3c4bb5d72669ffd7";

  cardList: Card[];
  cardCount: number;
  commanderCards: Card[] = [];
  commanderSuggestions: Card[] = [];
  cardNamesOnly: string[];
  cardQuantityByName: Map<string, number> = new Map();
  tokenList: Card[];
  tokenIdList: string[];
  cardBackPreview: Card = {
    name: "Card Back Preview",
    image_uris: {
      normal: this.defaultCardBack
    },
    type_line: ""
  } as Card;
  loadingCards = false;
  pendingOperations: boolean[] = [];

  imgQualityOptions = [
    {name: "png", value: "png"},
    {name: "jpg", value: "normal"},
    {name: "small", value: "small"},
    {name: "no border", value: "border_crop"},
    {name: "art only", value: "art_crop"}
  ];
  imgQuality: FormControl = new FormControl(this.imgQualityOptions[0].value);
  deckName: FormControl = new FormControl('');
  cardBack: FormControl = new FormControl('');

  ngOnInit(): void {
    //this.getCards();
  }

  ngOnChanges(): void {
    this.getCards();
    this.updateCardBackPreview();
  }

  getCards(): void {
    // Reset everything first
    this.cardList = [];
    this.cardCount = 0;
    this.cardNamesOnly = [];
    this.tokenList = [];
    this.tokenIdList = [];
    this.commanderSuggestions = [];
    this.pendingOperations = [];
    this.loadingCards = true;
    if (this.commanderCards.length > 0) {
      this.commanderCards.forEach(card => card.isCommander === false)
    }
    this.commanderCards = [];
    if (!this.cardNames || this.cardNames.length === 0) {
      this.loadingCards = false;
      return;
    }
    
    // Parse decklist
    this.cardNames.forEach(line => {
      var lineSplit = line.replace(/\s/,'%').split('%');
      var quantity = lineSplit[0];
      var name = lineSplit[1];
      this.cardNamesOnly.push(name);
      this.cardQuantityByName.set(name, +quantity);
    });

    // Get the cards (75 at a time)
    this.pendingOperations.push(true);
    this.cardService.getCards(this.cardNamesOnly.slice(0, 75)).subscribe(cardList => {
      // Done loading?
      this.pendingOperations.pop();
      if (this.pendingOperations.length === 0) {
        this.loadingCards = false;
      }
      
      this.cardList = this.cardList.concat(cardList.data);
      this.sortDeck();
      cardList.data.forEach(card => this.processCard(card));
      this.updateCount();
      console.log(this.cardList);
    });
    var extraNames = this.cardNamesOnly.slice(75);
    while (extraNames.length > 0) {
      this.pendingOperations.push(true);
      var names = extraNames.splice(75);
      this.cardService.getCards(extraNames).subscribe(cardList => {
        // Done loading?
        this.pendingOperations.pop();
        if (this.pendingOperations.length === 0) {
          this.loadingCards = false;
        }
        
        this.cardList = this.cardList.concat(cardList.data);
        this.sortDeck();
        cardList.data.forEach(card => this.processCard(card));
        this.updateCount();
        console.log(this.cardList);
      });
      extraNames = names;
    }
  }

  showCards(): void {
    console.log(this.cardList);
  }

  setCommander(card: Card): void {
    this.commanderCards.push(card);
    this.commanderCards.sort((a, b) => a.name.localeCompare(b.name));
    this.cardList.splice(this.cardList.indexOf(card), 1);
    this.updateCount();
  }

  unsetCommander(card: Card): void {
    this.cardList.push(card);
    this.commanderCards.splice(this.commanderCards.indexOf(card), 1);
    this.sortDeck();
    this.updateCount();
  }

  exportCards() {
    this.cardService.exportDeck(this.cardList, this.commanderCards, this.tokenList, this.imgQuality.value, this.deckName.value, this.cardBack.value);
  }

  isDeckValid(): boolean {
    return this.commanderCards.length > 0 && this.deckName.value;
  }

  updateCardBackPreview(): void {
    var newUrl = "";
    if (this.cardBack.value === "") {
      newUrl = this.defaultCardBack;
    } else {
      newUrl = this.cardBack.value;
    }
    if (this.cardBackPreview.image_uris["normal"] === newUrl) {
      return;
    }
    this.cardBackPreview = {
      name: "Card Back Preview",
      image_uris: {
        normal: newUrl
      },
      type_line: ""
    } as Card;
  }

  private updateCount(): void {
    this.cardCount = 0;
    this.cardList.forEach(card => {
      this.cardCount += card.quantity;
    });
  }

  private sortDeck(): void {
    this.cardList = this.cardList.sort((a, b) => a.name.localeCompare(b.name));
  }

  private processCard(card: Card): void {
    card.isCommander = false;
    // Check commander
    if ((card.type_line.includes("Legendary") && card.type_line.includes("Creature")) ||
         card.oracle_text?.includes("can be your commander")) {
      this.commanderSuggestions.push(card);
      this.commanderSuggestions = this.commanderSuggestions.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Check flip card
    if (card.layout === "transform") {
      this.getFaceCard(card);
    }
    // Check tokens
    if (card.all_parts) {
      this.getTokensForCard(card);
    }
    card.quantity = this.cardQuantityByName.get(card.name);
  }

  private getFaceCard(card: Card): void {
    card.image_uris = card.card_faces[0].image_uris;
    card.back_image_uris = card.card_faces[1].image_uris;
  }

  private getTokensForCard(card: Card): void {
    var tokens: Token[] = card.all_parts.filter(el => el.component === "token");
    console.log(tokens);
    tokens.forEach(token => {
      if (this.tokenIdList.includes(token.id)) {
        return;
      }
      this.tokenIdList.push(token.id);
      this.pendingOperations.push(true)
      this.cardService.getToken(token).subscribe((t: Card) => {
        // Done loading?
        this.pendingOperations.pop();
        if (this.pendingOperations.length === 0) {
          this.loadingCards = false;
        }

        if (this.tokenList.find(a => a.oracle_id === t.oracle_id)) {
          return;
        }
        this.tokenList.push(t);
        if (t.layout === "transform") {
          this.getFaceCard(t);
        }
        this.tokenList = this.tokenList.sort((a, b) => a.name.localeCompare(b.name))
        //console.log(this.tokenList);
      });
    });
  }
}
