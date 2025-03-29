#ifndef INCOMES_H
#define INCOMES_H

#define MAX_CHAR 50
#define MAX_DATE 9

typedef struct{
    char category[MAX_CHAR];
    float amount;
    char date[MAX_DATE];
} Income;

void add_income(Income *income);
#endif