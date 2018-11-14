# Vanguard Funds

This tool uses Puppeteer to log in to your Vanguard account and fetch your current fund status. The current date (UTC) and all of your fund information will be written to `stdout` as JSON.

## Installation

```
npm install vanguard-funds
```

## Authentication

There are three ways to provide authentication details to this tool.

* If you provide a config file that only contains username but not password, the command will prompt you for a username and a password. You can press enter to skip the username field and it will default to your config file value
* Command line arguments override configuration files

### Config file

Create `~/.vanguard/credentials` with the following contents, replacing the values with your credentials:

```ini
[default]
username=myusername1234
password=this1s4pAssw0rD
```

### Command line parameters

```bash
vanguard-funds -u myusername123 -p this1s4pAssw0rD
```

### Let the tool prompt you

If you don't provide a config file or command line arguments, the tool will prompt you to input your credentials when it runs (don't worry, the password is masked).

## Usage

Assuming that you've configured your credentials correctly, all you need to do is run `vanguard-funds` on the command line

## Caveats

If you put your Vanguard password in a config file or on the command line history, make sure that no-one else can read those files.

I run this on the command line, passing my Vanguard password as a parameter, populated from 1Password:

```
vanguard-funds -p $(op get item VanguardInvestments | jq -r '.details.fields[] | select(.designation == "password").value')
```
