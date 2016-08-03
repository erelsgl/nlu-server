#set terminal pdf monochrome size 1000,1000
set terminal png nocrop noenhanced size 1000,1000
set datafile missing "null"
#set yrange [0:0.7]
set grid ytics
set grid xtics
set key bottom right
set key autotitle columnhead

set key font ",25"
set ytics 0,0.1,1
set xtics nomirror
set tics font ", 23"
#set xtics rotate by -90
set autoscale xfix
#set xlabel 'Utterances'
set lmargin 11
set xlabel 'Utterances' font ",25"
#set ylabel 'macro-F1' font ",25" offset 0,0


set style line 1 linewidth 2 linecolor rgb 'light-red' pointsize 3 pointtype 5 #Solid Square
set style line 2 linewidth 2 linecolor rgb 'blue' pointsize 3 pointtype 7 #Solid Round 
set style line 3 linewidth 2 linecolor rgb 'green' pointsize 3 pointtype 9 #Triangle Up 
set style line 4 linewidth 2 linecolor rgb 'brown' pointsize 3 pointtype 11 #Triangle Down 
set style line 5 linewidth 2 linecolor rgb 'coral' pointsize 3 pointtype 13 #Romb
set style line 6 linewidth 2 linecolor rgb 'purple' pointsize 3 pointtype 17 #fiveangle
set style line 7 linewidth 2 linecolor rgb 'salmon' pointsize 3 pointtype 4 
set style line 8 linewidth 2 linecolor rgb 'magenta' pointsize 3 pointtype 6 
set style line 9 linewidth 2 linecolor rgb 'black' pointsize 3 pointtype 8 
