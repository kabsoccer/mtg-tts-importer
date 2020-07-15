import { Component, OnInit, Input, Output, EventEmitter, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { Card } from '../data/card';
import { CardService } from '../services/card.service';
import { FormControl } from '@angular/forms';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-card-detail',
  templateUrl: './card-detail.component.html',
  styleUrls: ['./card-detail.component.css']
})
export class CardDetailComponent implements OnInit {

  @Input() card: Card;
  @Input() quality: string;
  @Output() commanderSelected = new EventEmitter<Card>();
  @Output() commanderDeselected = new EventEmitter<Card>();
  @ViewChildren(MatSelect) matSelect: QueryList<MatSelect>;

  setOptions = []
  set: FormControl = new FormControl();
  setData: Card[];
  showSet: boolean = false;
  showCardBack: boolean = false;
  allowSetChange: boolean = true;
  
  cardImg: string = "";

  constructor(private cardService: CardService) { }

  ngOnInit(): void {
    if (this.card.name === "Card Back Preview") {
      this.allowSetChange = false;
    }
  }

  ngAfterViewInit() {
    this.matSelect.changes.subscribe((matSelect: QueryList<MatSelect>) => {
      setTimeout(()=>{matSelect.first?.focus()}, 1);
    });
  }

  ngOnChanges(): void {
    this.refreshArt();
    this.showSet = false;
    this.setOptions = [{name: this.card.set, display: this.card.set_name, id: this.card.id}];
    this.set.setValue(this.setOptions[0].id);
  }

  getSets() {
    this.showSet = true;
    this.cardService.getSets(this.card).subscribe(sets => {
      this.setData = sets.data;
      this.setOptions = sets.data.map(el => ({name: el.set, display: el.set_name, id: el.id}));
    });
  }

  changeSet() {
    //console.log(this.set.value);
    var cardToSet = this.setData.find(card => card.id === this.set.value);
    if (cardToSet.layout === "transform") {
      cardToSet.image_uris = cardToSet.card_faces[0].image_uris;
      cardToSet.back_image_uris = cardToSet.card_faces[1].image_uris;
    }
    Object.entries(cardToSet).forEach(property => {
      this.card[property[0]] = property[1];
    });
    this.refreshArt();
  }

  setCommander() {
    this.card.isCommander = true;
    this.showSet = false;
    this.commanderSelected.emit(this.card);
  }

  unsetCommander() {
    this.card.isCommander = false;
    this.showSet = false;
    this.commanderDeselected.emit(this.card);
  }

  canBeCommander(): boolean {
    return !this.card.isCommander &&
      ((this.card.type_line.includes("Legendary") && this.card.type_line.includes("Creature")) ||
      this.card.oracle_text?.includes("can be your commander"));
  }

  private refreshArt() {
    if (this.card.image_uris) {
      if (this.showCardBack && this.card.back_image_uris) {
        this.cardImg = this.card.back_image_uris[this.quality];
      } else {
        this.cardImg = this.card.image_uris[this.quality];
      }
    }
  }

  onBlur() {
    console.log("blur");
  }

  toggleCardBack() {
    this.showCardBack = !this.showCardBack;
    this.refreshArt();
  }
}
