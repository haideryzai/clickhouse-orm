class Literal {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

function literal(value) {
  return new Literal(value);
}

module.exports = {
  literal,
  Literal
};
