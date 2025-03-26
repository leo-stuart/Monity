#ifndef EXPENSES_H
#define EXPENSES_H

//Defining consts
#define MAX_CHAR 50
#define MAX_DATE 9

//Expenses have description, amount, category and date.
typedef struct Expenses 
{
    char description[MAX_CHAR];
    float amount;
    char category[MAX_CHAR];
    char date[MAX_DATE];
} Expense;

//Struct variable
Expense expense;

void add_expense();
void list_expenses();















#endif