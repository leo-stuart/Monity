#include "expenses.h"
#include <stdlib.h>
#include <ctype.h>
#include <string.h>
#include <stdio.h>

int write(Expense expense)
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "a");
    if (outfile == NULL)
    {
        printf("Could not open %s.\n", outgoings);
        return 1;
    }
    fprintf(outfile, "%s,%.2f,%s,%s\n", expense.description, expense.amount, expense.category, expense.date);

    fclose(outfile);

    return 0;
}

void add_expense(Expense *expense)
{
    char temp[MAX_CHAR];

    int clear;
    while ((clear = getchar()) != '\n' && clear != EOF)
        ;

    printf("\nExpense short description: ");
    if (fgets(expense->description, sizeof(expense->description), stdin) != NULL)
    {
        expense->description[strcspn(expense->description, "\n")] = '\0';
    }

    printf("\nHow much did you spend: ");
    if (fgets(temp, sizeof(temp), stdin) != NULL)
    {
        expense->amount = atof(temp);
    }

    printf("\nExpense category: ");
    if (fgets(expense->category, sizeof(expense->category), stdin) != NULL)
    {
        expense->category[strcspn(expense->category, "\n")] = '\0';
    }

    printf("\nWhen did you bought it [MM/DD/YY]: ");
    if (fgets(expense->date, sizeof(expense->date), stdin) != NULL)
    {
        expense->date[strcspn(expense->date, "\n")] = '\0';
    }
}

int list_expenses()
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("Could not open %s.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    while (fgets(line, sizeof(line), outfile))
    {
        char *desc = strtok(line, ",");
        if (desc == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *cat = strtok(NULL, ",");
        if (cat == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        printf("📌 %s | 💸 $%s | 🍽️  Category: %s | 🗓️  Date: %s\n", desc, amount, cat, data);
    }

    fclose(outfile);

    return 0;
}

int filter_by_cat(char filter_category[])
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("Could not open %s.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    while (fgets(line, sizeof(line), outfile))
    {
        char *desc = strtok(line, ",");
        if (desc == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *cat = strtok(NULL, ",");
        if (cat == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        if (strcmp(cat, filter_category) == 0)
        {
            printf("📌 %s | 💸 $%s | 🍽️  Category: %s | 🗓️  Date: %s\n", desc, amount, cat, data);
        }
    }

    fclose(outfile);

    return 0;
}

int filter_by_date(char filter_date[])
{
    char *outgoings = "expenses.txt";
    FILE *outfile = fopen(outgoings, "r");
    if (outfile == NULL)
    {
        printf("Could not open %s.\n", outgoings);
        return 1;
    }

    // buffer
    char line[256];
    while (fgets(line, sizeof(line), outfile))
    {
        char *desc = strtok(line, ",");
        if (desc == NULL)
            continue;

        char *amount = strtok(NULL, ",");
        if (amount == NULL)
            continue;

        char *cat = strtok(NULL, ",");
        if (cat == NULL)
            continue;

        char *data = strtok(NULL, ",");
        if (data == NULL)
            continue;

        if (strcmp(data, filter_date) == 0)
        {
            printf("📌 %s | 💸 $%s | 🍽️  Category: %s | 🗓️  Date: %s\n", desc, amount, cat, data);
        }
    }

    fclose(outfile);

    return 0;
}
