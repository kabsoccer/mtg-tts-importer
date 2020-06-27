import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardListComponent } from '../card-list/card-list.component';

@Component({
  selector: 'app-card-search',
  templateUrl: './card-search.component.html',
  styleUrls: ['./card-search.component.css']
})
export class CardSearchComponent implements OnInit {

  constructor() { }

  cardNamesString: FormControl = new FormControl('');
  cardNamesArray: string[];

  @ViewChild(CardListComponent)
  private cardListComp: CardListComponent;

  ngOnInit(): void {
  }

  searchCards(): void {
    // console.log(this.cardNamesString.value);
    this.cardNamesArray = this.cardNamesString.value.trim().split(/\s*\n+\s*/g);
    this.cardNamesArray = this.cardNamesArray.filter(name => name != "");
    console.log(this.cardNamesArray);
    return;
  }
}
