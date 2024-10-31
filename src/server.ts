function welcome(name: string) {
    const person1 = {
        name: 'Rahul',
        age: 30,
    }
    const personName = person1.name
    return `Welcome ${name}` + personName
}

welcome('John Doe')
