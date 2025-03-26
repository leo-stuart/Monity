#ifndef EXPENSES_H
#define EXPENSES_H

#define MAX_CHAR 50
#define MAX_DATE 9

typedef struct Expenses
{
    char description[MAX_CHAR];
    float amount;
    char category[MAX_CHAR];
    char date[MAX_DATE];
} Expenses;

















#endif