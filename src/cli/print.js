function printOut(format, textOutput, jsonOutput) {
  if (format === 'json') {
    console.log(JSON.stringify(jsonOutput, null, 2));
    return;
  }
  console.log(textOutput);
}

module.exports = { printOut };
