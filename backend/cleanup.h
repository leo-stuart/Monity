#ifndef CLEANUP_H
#define CLEANUP_H

#define MAX_CHAR 50

int delete_expense(char []);
int delete_income(char []);
int delete_income_api(int);
int delete_expense_api(int);
int edit_expense(char []);
int edit_income(char []);
void cleanup_menu();

#endif