module.exports = {
  extends: ['airbnb-base', 'plugin:import/errors', 'prettier'],
  plugins: ['no-not-accumulator-reassign', 'prettier'],
  env: {
    node: true
  },
  rules: {
    'no-not-accumulator-reassign/no-not-accumulator-reassign': [2, ['reduce'], {props: true}],
    'no-undef': 1,
    'no-underscore-dangle': 0
  }
}
