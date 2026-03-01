export const problems = [
  {
    name: "October 2024",
    answer: ["3","4","7","6"],
    problems: [
      `<strong>ONE DOWN</strong><br>Little Timmy and \\(31\\) of his friends have all lost their jack-o-lanterns! Luckily, their teacher
        Ms. Sharpe has located them; however, she has no idea which jack-o-lantern belongs to
        which student. Lacking problem solving skills, Ms. Sharpe randomly returns each
        jack-o-lantern to a different student. If the probability that none of the children get their own
        jack-o-lantern back is \\(x\\), find the value of \\(100x\\) rounded to the nearest integer.`,
      `<strong>THREE ACROSS</strong><br>Charlie Brown, being a popular guy at his high school, has been invited to attend a
        Halloween party this year! However, he doesn't want to miss out on trick-or-treating at the 3
        houses that offer king-sized candy bars either - Houses \\(A\\) (RED), \\(B\\) (PINK), and \\(C\\)
        (ORANGE). Luckily for Charlie, Houses \\(A\\), \\(B\\), and \\(C\\) all exist on the \\(4 \\times 4\\) grid between his
        house (YELLOW) and the party. Charlie plans to determine a round-trip route which takes
        the shortest distance possible to hit Houses \\(A\\), \\(B\\), and \\(C\\) while also attending the party. If
        Charlie chooses not to pass the same house twice in fear of being recognized for candy fraud,
        there exists \\(x\\) different possible routes that he can take while staying on the lattice lines of the
        grid. Find the value of \\(x - 404\\).`, /* TODO: add grid image */
      `<strong>ONE ACROSS</strong><br>After trick-or-treating, Sally organizes her candies in groups of \\(5\\) and has \\(4\\) leftover; then, she eats the leftover candies. Sally then
        arranges the remaining candies into groups of \\(4\\) and has \\(2\\) leftover; again, she eats the leftover candies. Sally rearranges her remaining
        candies one last time into groups of \\(3\\) and has \\(1\\) leftover. What is the smallest number of candies that Sally could have initially had?`,
      `<strong>TWO DOWN</strong><br>Vista Way is a road in Idaho which is renowned for its decorations on Halloween. The house numbers of the \\(28\\) houses on Vista Way
        that have candy are the first \\(28\\) positive perfect squares. Find the smallest \\(n\\) such that \\(n!\\) is divisible by each of these house numbers.`
    ],
    solutions: [
      `This problem is a common example of a derangement—a permutation which leaves no
        element in its original place. In this case, we are looking for the probability that none of
        the jack-o-lanterns are being returned to their original owner. As the number of elements
        in set approaches infinity, the probability that a derangement happens approaches \\(\\frac{1}{e}\\).
        Thus, the answer is \\(\\frac{100}{e} \\approx 37\\).<br><strong>Problem credits:</strong> Kevin Z.`,
      `Example solution 2`,
      `Example solution 3`,
      `Example solution 4`
    ]
  },
];
