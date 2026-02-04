# Pattern Grammar Specification (BNF)

The Blacksmith Pattern Language is defined by the following Backus-Naur Form (BNF) grammar.

## 1. Binary Pattern
Simple on/off toggling of commits.

```bnf
<binary-pattern> ::= <binary-string>
<binary-string>  ::= <bit> | <bit> <binary-string>
<bit>            ::= "0" | "1"
```
*Example:* `10110` (Commit, Skip, Commit, Commit, Skip)

## 2. Weekday Pattern ("Shivu" Dialect)
Maps characters to specific days of the week.

```bnf
<weekday-pattern> ::= <char-sequence>
<char-sequence>   ::= <char> | <char> <char-sequence>
<char>            ::= "S" | "M" | "T" | "W" | "t" | "F" | "s" 
                    | "S" | "h" | "i" | "v" | "u" ; Custom mapping
```
*Default Mapping (Shivu):*
*   `S`: Sunday
*   `h`: Monday
*   `i`: Tuesday
*   `v`: Wednesday
*   `u`: Thursday
*   `_`: Skip (Friday/Saturday implied or explicit skip)

## 3. Cron Pattern
Standard cron syntax for periodic commits.

```bnf
<cron-pattern> ::= <minute> " " <hour> " " <day-of-month> " " <month> " " <day-of-week>
<minute>       ::= "*" | <integer-range>
<hour>         ::= "*" | <integer-range>
<day-of-month> ::= "*" | <integer-range>
<month>        ::= "*" | <integer-range>
<day-of-week>  ::= "*" | <integer-range>
```
*Example:* `* * * * 1` (Every Monday)

## 4. Fractal Pattern
Recursive geometric structures mapped to time.

```bnf
<fractal-pattern> ::= <fractal-type> ":" <depth>
<fractal-type>    ::= "sierpinski" | "cantor"
<depth>           ::= <integer>
```
*Example:* `sierpinski:3`

## 5. Composite Grammar
The root pattern type.

```bnf
<pattern> ::= <binary-pattern> 
            | <weekday-pattern> 
            | <cron-pattern> 
            | <fractal-pattern>
```
