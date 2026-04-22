const Colors = {
  Reset: '\x1b[0m',
  Blue: '\x1b[34m',
  Green: '\x1b[32m',
  Yellow: '\x1b[33m',
  Red: '\x1b[31m',
  Gray: '\x1b[90m',
};

export const logger = {
  info: (msg: string) => {
    console.log(`${Colors.Blue}[info]${Colors.Reset} ${msg}`);
  },

  success: (msg: string) => {
    console.log(`${Colors.Green}[ok]${Colors.Reset} ${msg}`);
  },

  warn: (msg: string) => {
    console.log(`${Colors.Yellow}[warn]${Colors.Reset} ${msg}`);
  },

  error: (msg: string) => {
    console.log(`${Colors.Red}[error]${Colors.Reset} ${msg}`);
  },

  step: (n: number, total: number, msg: string) => {
    console.log(`${Colors.Gray}[${n}/${total}]${Colors.Reset} ${msg}`);
  },

  indent: (msg: string) => {
    console.log(`  ${msg}`);
  },

  blank: () => {
    console.log('');
  },
};
