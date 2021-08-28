pragma solidity >=0.8.0;

contract Grocery {
  uint itemSize = 3;
  
  string[3] public store = ["Apple", "Carrot", "Orange"];

  constructor() {
    createItems();
  }

  mapping(uint => Item) public items;

  struct Item{
    uint id;
    string name;
    uint qty;
  }

  function createItems() private {  
    for(uint k=1; k <= itemSize; k++){
        items[k] = Item(k,store[k-1],0);
    }
  }

  function changeQty(uint _itemId,uint _newQty) public {
    require(_itemId >=1 && _itemId <=itemSize, "Wrong id");   
    items[_itemId].qty = _newQty;
  }

}