import chalk from 'chalk'

export const printer = {
  info(message: string) {
    console.log(chalk.cyan(message))
  },
  success(message: string): void {
    console.log(chalk.green(message))
  },
  warning(message: string): void {
    console.log(chalk.yellow(message))
  },
  error(message: string): void {
    console.error(chalk.red(message))
  },
  muted(message: string): void {
    console.log(chalk.gray(message))
  },
  section(message: string): void {
    console.log(`\n${chalk.bold(message)}`)
  },
  table(rows: Array<{ label: string; value: string }>): void {
    const width = Math.max(...rows.map((row) => row.label.length), 0)
    for (const row of rows) {
      console.log(`${chalk.bold(row.label.padEnd(width))}  ${row.value}`)
    }
  },
}
