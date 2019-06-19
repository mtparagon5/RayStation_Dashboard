// constructors
function Category(name, pertType) {
  this.name = name;
  this.visible = true;

  this.pert = pertType;
}

function Point(category, y) {
  this.y = y;

  this.category = category;
}